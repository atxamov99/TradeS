const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

const getProducts = async (userId, queryParams = {}, options = {}) => {
  const { search, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = queryParams;
  const { isAdmin = false } = options;

  const where = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  // Faqat oddiy userlar uchun ownerId filter
  if (!isAdmin && userId) {
    where.ownerId = userId;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
  const sortField = sortBy === 'name' ? 'name' : 'createdAt';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortField]: order },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / take),
    limit: take,
  };
};

const getProductById = async (id, userId, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    where.ownerId = userId;
  }

  const product = await prisma.product.findFirst({
    where,
    include: {
      reviews: true,
    },
  });

  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const createProduct = async (productData, userId) => {
  // images is a relation (ProductImage[]) — Prisma needs { create: [...] }, not a raw array
  const { images = [], ...rest } = productData;
  const slug = slugify(rest.name, { lower: true, strict: true }) + '-' + Date.now();
  const finalPrice = rest.price - (rest.price * (rest.discount || 0)) / 100;

  const product = await prisma.product.create({
    data: {
      ...rest,
      slug,
      finalPrice,
      ownerId: userId,
      createdById: userId,
      images: { create: images.map((img) => ({ url: img.url, alt: img.alt || '' })) },
    },
    include: { images: true },
  });
  return product;
};

const updateProduct = async (id, userId, updateData, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    where.ownerId = userId;
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');

  // images is a relation — pull it out of the scalar update and, if provided,
  // replace the whole image set (delete existing + create new)
  const { name, price, discount, images, ...newData } = updateData;
  if (name !== undefined) newData.name = name;
  if (price !== undefined) newData.price = price;
  if (discount !== undefined) newData.discount = discount;

  if (name && name !== product.name) {
    newData.slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();
  }

  if (price !== undefined || discount !== undefined) {
    const p = price !== undefined ? price : product.price;
    const d = discount !== undefined ? discount : product.discount;
    newData.finalPrice = p - (p * d) / 100;
  }

  if (images !== undefined) {
    newData.images = {
      deleteMany: {},
      create: images.map((img) => ({ url: img.url, alt: img.alt || '' })),
    };
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: newData,
    include: { images: true },
  });

  return updatedProduct;
};

const deleteProduct = async (id, userId, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    where.ownerId = userId;
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');

  try {
    await prisma.product.delete({
      where: { id },
    });
    return { message: "Mahsulot o'chirildi" };
  } catch (err) {
    throw new ApiError(404, 'Product not found');
  }
};

const addReview = async (productId, userId, userName, { rating, comment }) => {
  const existingReview = await prisma.review.findFirst({
    where: { productId, userId },
  });

  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this product');
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId,
      name: userName,
      rating,
      comment,
    },
  });

  // Calculate average rating
  const reviews = await prisma.review.findMany({ where: { productId } });
  const count = reviews.length;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  // We might want to update the Product model if it had cached ratings
  // But our Prisma schema didn't have rating.average fields, I should check it.
  // Actually, I'll just return the review or product.

  return review;
};

const getCategories = async (userId, options = {}) => {
  const { isAdmin = false } = options;
  const where = {};
  if (!isAdmin && userId) {
    where.ownerId = userId;
  }
  const products = await prisma.product.findMany({
    where,
    select: { category: true },
    distinct: ['category'],
  });
  return products.map(p => p.category).filter(Boolean).sort();
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
};
