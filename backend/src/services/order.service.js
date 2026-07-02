const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const TAX_RATE = 0.1;
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5;

const createOrder = async (userId, { items, shippingAddress, paymentMethod, notes }) => {
  return await prisma.$transaction(async (tx) => {
    const resolvedItems = [];
    let itemsPrice = 0;

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.product },
        include: { images: true },
      });
      if (!product || !product.isActive) {
        throw new ApiError(404, `Product ${item.product} not found`);
      }

      // Atomic check-and-decrement: guards against overselling under concurrent orders.
      // updateMany only touches the row if stock is still >= quantity at write time.
      const decremented = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        throw new ApiError(400, `Insufficient stock for "${product.name}"`);
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

    const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const taxPrice = Math.round(itemsPrice * TAX_RATE * 100) / 100;
    const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

    // Generate order number
    const count = await tx.order.count();
    const orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(5, '0')}`;

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

    // Clear cart
    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { totalItems: 0, totalPrice: 0 },
      });
    }

    return order;
  });
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
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: 'cancelled' },
    });

    // Restore product stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return updatedOrder;
  });
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
