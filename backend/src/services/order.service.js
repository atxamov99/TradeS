const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { assertShopOwnership } = require('./shop.service');
const { clampLimit, clampPage } = require('../utils/pagination');

const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5;

const createOrder = async (userId, { items, shippingAddress, paymentMethod, notes, posSale }) => {
  // Read product details up front, OUTSIDE the transaction, in a single query.
  // Keeping the interactive transaction short avoids exceeding its timeout under
  // concurrent load on a high-latency (serverless) database. Stock is still guarded
  // atomically inside the transaction via updateMany, so this cannot oversell.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.product) } },
    include: { images: true, shop: { select: { id: true, ownerId: true, isBlocked: true } } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  // A cart may hold products from several shops, but an order belongs to exactly
  // one shop (it is that seller's to fulfil). So checkout fans out into one order
  // per shop, each with its own orderNumber, totals and shipping address copy.
  //
  // An unavailable product (deleted, archived, or its shop blocked) only removes
  // that ONE item: the other shops in the cart still get their orders. Aborting the
  // whole checkout would let a single blocked seller take the rest of the cart down
  // with it. The caller is told what was dropped so the UI can report it.
  const groups = new Map();
  const skipped = [];
  const acceptedItems = [];
  for (const item of items) {
    const product = productById.get(item.product);
    if (!product || !product.isActive || product.shop.isBlocked) {
      skipped.push({
        productId: item.product,
        name: product?.name || null,
        quantity: item.quantity,
        reason: !product ? 'PRODUCT_NOT_FOUND' : product.shop.isBlocked ? 'SHOP_BLOCKED' : 'PRODUCT_INACTIVE',
        message: `"${product?.name || item.product}" endi mavjud emas`,
      });
      continue;
    }

    acceptedItems.push(item);

    let group = groups.get(product.shopId);
    if (!group) {
      group = { shopId: product.shopId, shopOwnerId: product.shop.ownerId, items: [], resolvedItems: [], itemsPrice: 0 };
      groups.set(product.shopId, group);
    }

    group.items.push(item);
    group.resolvedItems.push({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || '',
      price: product.finalPrice,
      quantity: item.quantity,
    });
    group.itemsPrice += product.finalPrice * item.quantity;
  }

  // Nothing left to buy — there is no partial success to report, so this is still
  // an error for the whole request.
  if (groups.size === 0) {
    throw new ApiError(404, skipped[0]?.message || 'Buyurtma uchun mavjud mahsulot yo\'q', skipped, '', 'PRODUCT_UNAVAILABLE');
  }

  for (const group of groups.values()) {
    group.itemsPrice = Math.round(group.itemsPrice * 100) / 100;
    group.shippingPrice = group.itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    group.taxPrice = 0; // No payment integration in v1 — tax has nothing to attach to yet.
    group.totalPrice = Math.round((group.itemsPrice + group.shippingPrice + group.taxPrice) * 100) / 100;
    // Random suffix (not a table count) so concurrent orders can't collide on the
    // @unique orderNumber, and so we avoid an extra round-trip inside the transaction.
    group.orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  return await prisma.$transaction(
    async (tx) => {
      // Do all the non-contended writes FIRST (orders + items + addresses, then cart
      // clearing). None of these lock the product rows.
      const orders = [];
      for (const group of groups.values()) {
        const order = await tx.order.create({
          data: {
            userId,
            shopId: group.shopId,
            orderNumber: group.orderNumber,
            paymentMethod,
            notes,
            itemsPrice: group.itemsPrice,
            shippingPrice: group.shippingPrice,
            taxPrice: group.taxPrice,
            totalPrice: group.totalPrice,
            items: {
              create: group.resolvedItems,
            },
            shippingAddress: {
              create: shippingAddress,
            },
          },
          include: {
            items: true,
            shippingAddress: true,
            shop: { select: { id: true, name: true } },
          },
        });
        orders.push(order);
      }

      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({
          where: { id: cart.id },
          data: { totalItems: 0, totalPrice: 0 },
        });
      }

      // Atomic check-and-decrement LAST, immediately before COMMIT. updateMany only
      // touches the row if stock is still >= quantity at write time, so this can never
      // oversell. Doing it last means the product row lock (held until COMMIT in
      // Postgres) is held for the shortest possible window, so concurrent orders for
      // the SAME product serialize on the lock only briefly instead of queueing behind
      // each other's full transaction and blowing the interactive-transaction timeout.
      // Sort by product id so every transaction acquires row locks in the same order;
      // otherwise two concurrent orders touching the same products in reversed order
      // can deadlock (Postgres 40P01).
      const sortedItems = [...acceptedItems].sort((a, b) => a.product.localeCompare(b.product));
      for (const item of sortedItems) {
        const decremented = await tx.product.updateMany({
          where: { id: item.product, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (decremented.count === 0) {
          const product = productById.get(item.product);
          throw new ApiError(400, `Insufficient stock for "${product?.name || item.product}"`);
        }
      }

      // POS flow: mirror each ordered item into a Sale so the merchant's own
      // Dashboard/Reports (which read the Sale table) reflect this in-store sale.
      // Profit uses the product's sell/buy price, matching the mobile POS UI.
      // Only groups whose shop the caller owns are mirrored — a buyer checking
      // out with posSale=true must not be able to write into a seller's books.
      if (posSale) {
        for (const group of groups.values()) {
          if (group.shopOwnerId !== userId) continue;
          for (const item of group.items) {
            const product = productById.get(item.product);
            const sellPrice = product.sellPrice || product.finalPrice || 0;
            const buyPrice = product.buyPrice || 0;
            const qty = item.quantity;
            await tx.sale.create({
              data: {
                userId,
                shopId: group.shopId,
                productId: product.id,
                productName: product.name,
                quantity: qty,
                unit: product.unit || 'pcs',
                sellPrice,
                buyPrice,
                totalRevenue: qty * sellPrice,
                totalCost: qty * buyPrice,
                profit: qty * sellPrice - qty * buyPrice,
                note: notes || '',
                isFromOffline: false,
              },
            });
          }
        }
      }

      return { orders, skipped };
    },
    { maxWait: 10000, timeout: 20000 }
  );
};

const getUserOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const take = clampLimit(limit, 10);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: { include: { product: true } },
        shop: { select: { id: true, name: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { orders, total, page: currentPage, pages: Math.ceil(total / take) };
};

// Seller side: orders buyers placed with one of the caller's shops — the mobile
// app's "Kelgan buyurtmalar" screen.
const getShopOrders = async (shopId, userId, { page = 1, limit = 20, status } = {}) => {
  await assertShopOwnership(shopId, userId);

  const where = { shopId };
  if (status) where.orderStatus = status;

  const take = clampLimit(limit, 20);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: true,
        shippingAddress: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page: currentPage, pages: Math.ceil(total / take) };
};

const getOrderById = async (orderId, userId, role) => {
  const where = { id: orderId };
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    where.userId = userId;
  }

  // findFirst (not findUnique): non-admin filter adds userId, which isn't a unique key
  const order = await prisma.order.findFirst({
    where,
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
      shippingAddress: true,
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

const updateOrderStatus = async (orderId, { orderStatus, paymentStatus }) => {
  const data = {};
  if (orderStatus) {
    data.orderStatus = orderStatus;
    if (orderStatus === 'delivered') data.deliveredAt = new Date();
    if (orderStatus === 'paid') data.paidAt = new Date();
  }
  if (paymentStatus) {
    data.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') data.paidAt = new Date();
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data,
    });
    return order;
  } catch (err) {
    throw new ApiError(404, 'Order not found');
  }
};

// Seller side of updateOrderStatus: the shop owner fulfilling an incoming order.
// assertShopOwnership answers "may this user act on this shop?", then the order is
// re-read scoped to that shop — so a seller passing another seller's orderId gets a
// 404 instead of writing to it.
const updateShopOrderStatus = async (shopId, orderId, userId, { orderStatus, paymentStatus }) => {
  await assertShopOwnership(shopId, userId);

  const order = await prisma.order.findFirst({ where: { id: orderId, shopId }, select: { id: true } });
  if (!order) throw new ApiError(404, 'Order not found');

  return updateOrderStatus(orderId, { orderStatus, paymentStatus });
};

const cancelOrder = async (orderId, userId) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  if (['shipped', 'delivered'].includes(order.orderStatus)) {
    throw new ApiError(400, 'Cannot cancel an order that has been shipped or delivered');
  }

  return await prisma.$transaction(async (tx) => {
    // Atomically transition to cancelled. The guard is inside the write so two
    // concurrent cancels for the same order can't both pass — only one gets count===1,
    // preventing stock from being incremented back twice.
    const transition = await tx.order.updateMany({
      where: {
        id: orderId,
        userId,
        orderStatus: { notIn: ['cancelled', 'shipped', 'delivered'] },
      },
      data: { orderStatus: 'cancelled' },
    });

    if (transition.count === 0) {
      throw new ApiError(400, 'Order can no longer be cancelled');
    }

    // Restore product stock (only reached by the single winning cancel)
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.findUnique({ where: { id: orderId } });
  });
};

module.exports = {
  createOrder,
  getUserOrders,
  getShopOrders,
  getOrderById,
  updateOrderStatus,
  updateShopOrderStatus,
  cancelOrder,
};
