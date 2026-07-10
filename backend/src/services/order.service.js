const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const TAX_RATE = 0.1;
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5;

const createOrder = async (userId, { items, shippingAddress, paymentMethod, notes, posSale }) => {
  // Read product details up front, OUTSIDE the transaction, in a single query.
  // Keeping the interactive transaction short avoids exceeding its timeout under
  // concurrent load on a high-latency (serverless) database. Stock is still guarded
  // atomically inside the transaction via updateMany, so this cannot oversell.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.product) } },
    include: { images: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const resolvedItems = [];
  let itemsPrice = 0;
  for (const item of items) {
    const product = productById.get(item.product);
    if (!product || !product.isActive) {
      throw new ApiError(404, `Product ${item.product} not found`);
    }
    resolvedItems.push({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || '',
      price: product.finalPrice,
      quantity: item.quantity,
    });
    itemsPrice += product.finalPrice * item.quantity;
  }

  itemsPrice = Math.round(itemsPrice * 100) / 100;
  const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxPrice = Math.round(itemsPrice * TAX_RATE * 100) / 100;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;
  // Random suffix (not a table count) so concurrent orders can't collide on the
  // @unique orderNumber, and so we avoid an extra round-trip inside the transaction.
  const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  return await prisma.$transaction(
    async (tx) => {
      // Do all the non-contended writes FIRST (order + items + address, then cart
      // clearing). None of these lock the product rows.
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          paymentMethod,
          notes,
          itemsPrice,
          shippingPrice,
          taxPrice,
          totalPrice,
          items: {
            create: resolvedItems,
          },
          shippingAddress: {
            create: shippingAddress,
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

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
      const sortedItems = [...items].sort((a, b) => a.product.localeCompare(b.product));
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
      if (posSale) {
        for (const item of items) {
          const product = productById.get(item.product);
          const sellPrice = product.sellPrice || product.finalPrice || 0;
          const buyPrice = product.buyPrice || 0;
          const qty = item.quantity;
          await tx.sale.create({
            data: {
              userId,
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

      return order;
    },
    { maxWait: 10000, timeout: 20000 }
  );
};

const getUserOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: { include: { product: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { orders, total, page: Number(page), pages: Math.ceil(total / take) };
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
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
