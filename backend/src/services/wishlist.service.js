const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const getWishlist = async (userId) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          images: true,
          finalPrice: true,
          isActive: true,
        },
      },
    },
  });

  if (!wishlist) return { userId, products: [] };
  // Filter out inactive products from the response
  return { ...wishlist, products: wishlist.products.filter((p) => p.isActive) };
};

const toggleWishlist = async (userId, productId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { products: true },
  });

  const exists = wishlist.products.some((p) => p.id === productId);

  let action;
  let updatedWishlist;

  if (exists) {
    updatedWishlist = await prisma.wishlist.update({
      where: { userId },
      data: {
        products: { disconnect: { id: productId } },
      },
      include: { products: true },
    });
    action = 'removed';
  } else {
    updatedWishlist = await prisma.wishlist.update({
      where: { userId },
      data: {
        products: { connect: { id: productId } },
      },
      include: { products: true },
    });
    action = 'added';
  }

  return { action, wishlist: updatedWishlist };
};

const removeFromWishlist = async (userId, productId) => {
  try {
    const updatedWishlist = await prisma.wishlist.update({
      where: { userId },
      data: {
        products: { disconnect: { id: productId } },
      },
      include: { products: true },
    });
    return updatedWishlist;
  } catch (err) {
    throw new ApiError(404, 'Wishlist or product not found');
  }
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
