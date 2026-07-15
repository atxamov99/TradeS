const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: true,
              finalPrice: true,
              stock: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return { userId, items: [], totalItems: 0, totalPrice: 0 };
  }
  return cart;
};

const addToCart = async (userId, productId, quantity) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} items in stock`);
  }

  // Do the read-modify-write of the cart line atomically. Two concurrent "add"
  // requests for the same product would otherwise both read the old quantity and
  // clobber each other's write (lost update) — a transaction serialises them.
  return await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: true },
    });

    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) {
        throw new ApiError(400, `Only ${product.stock} items available`);
      }
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty, price: product.finalPrice },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.finalPrice,
        },
      });
    }

    // Recompute cart totals from the now-current items
    const updatedItems = await tx.cartItem.findMany({ where: { cartId: cart.id } });
    const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return await tx.cart.update({
      where: { id: cart.id },
      data: { totalItems, totalPrice },
      include: {
        items: { include: { product: true } }
      }
    });
  });
};

const removeFromCart = async (userId, productId) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, 'Cart not found');

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
  });

  // Recompute totals
  const updatedItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
  const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems, totalPrice },
    include: { items: true }
  });
};

const updateCartItem = async (userId, productId, quantity) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} items in stock`);
  }

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });
  if (!item) throw new ApiError(404, 'Item not in cart');

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity, price: product.finalPrice },
  });

  // Recompute totals
  const updatedItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
  const totalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return await prisma.cart.update({
    where: { id: cart.id },
    data: { totalItems, totalPrice },
    include: { items: true }
  });
};

const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { totalItems: 0, totalPrice: 0 },
    });
  }
};

module.exports = { getCart, addToCart, removeFromCart, updateCartItem, clearCart };
