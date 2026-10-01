const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');
const { assertShopOwnership } = require('./shop.service');
const { clampLimit, clampPage } = require('../utils/pagination');
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');

// Ownership of a product is now indirect: Product → Shop → owner. Every
// non-admin write filters on this instead of the dropped Product.ownerId.
const ownedBy = (userId) => ({ shop: { ownerId: userId } });

// Buyer-side marketplace listing: everything on sale across every shop.
// A blocked shop's catalog disappears from the marketplace entirely, while its
// rows stay intact for the owner and for order history.
const browseProducts = async (queryParams = {}) => {
  const { search, category, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = queryParams;

  const where = { isActive: true, shop: { isBlocked: false } };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }

  const take = clampLimit(limit, 50);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;
  const sortField = sortBy === 'name' ? 'name' : 'createdAt';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
      skip,
      take,
      include: { images: true, shop: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: currentPage,
    pages: Math.ceil(total / take),
    limit: take,
  };
};

// Seller-side "my shop's products" AND a buyer viewing one shop's catalog — the
// same query, differing only in whether archived (isActive=false) rows are
// visible. Only the owner sees those; a blocked shop is readable by its owner
// but not by anyone else.
const getShopProducts = async (shopId, userId, queryParams = {}) => {
  const { search, category, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = queryParams;

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, ownerId: true, isBlocked: true } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const asOwner = shop.ownerId === userId;
  if (!asOwner && shop.isBlocked) throw new ApiError(404, 'Shop not found');

  const where = { shopId };
  if (!asOwner) where.isActive = true;
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (category) where.category = category;

  const take = clampLimit(limit, 50);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;
  const sortField = sortBy === 'name' ? 'name' : 'createdAt';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
      skip,
      take,
      include: { images: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: currentPage,
    pages: Math.ceil(total / take),
    limit: take,
    asOwner,
  };
};

const getProductById = async (id) => {
  // Any authenticated user can view any product by id (the marketplace has no
  // per-product privacy); the listing endpoints are what apply shop filtering.
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      reviews: true,
      shop: { select: { id: true, name: true, isBlocked: true } },
    },
  });

  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const getProductBySlug = async (slug) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, reviews: true, shop: { select: { id: true, name: true, isBlocked: true } } },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const createProduct = async (shopId, userId, productData) => {
  await assertShopOwnership(shopId, userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });
  assertTestUserWithinLimits(user);

  // images is a relation (ProductImage[]) — Prisma needs { create: [...] }, not a raw array
  const { images = [], ...rest } = productData;
  if (rest.unit === 'box' && !(Number(rest.bagWeightKg) > 0)) {
    throw new ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED');
  }
  const slug = slugify(rest.name, { lower: true, strict: true }) + '-' + Date.now();
  const finalPrice = rest.price - (rest.price * (rest.discount || 0)) / 100;

  const product = await prisma.product.create({
    data: {
      ...rest,
      slug,
      finalPrice,
      shopId,
      images: { create: images.map((img) => ({ url: img.url, alt: img.alt || '' })) },
    },
    include: { images: true },
  });

  if (user.isTestUser) {
    await prisma.user.update({ where: { id: userId }, data: { testActionCount: { increment: 1 } } });
  }

  return product;
};

const updateProduct = async (id, userId, updateData, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    Object.assign(where, ownedBy(userId));
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');

  // images is a relation — pull it out of the scalar update and, if provided,
  // replace the whole image set (delete existing + create new)
  const { name, price, discount, images, ...newData } = updateData;
  const effectiveUnit = newData.unit !== undefined ? newData.unit : product.unit;
  const effectiveBagWeight = newData.bagWeightKg !== undefined ? newData.bagWeightKg : product.bagWeightKg;
  if (effectiveUnit === 'box' && !(Number(effectiveBagWeight) > 0)) {
    throw new ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED');
  }
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

const restockProduct = async (id, userId, { quantity, buyPrice, note } = {}, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    Object.assign(where, ownedBy(userId));
  }

  const product = await prisma.product.findFirst({
    where,
    include: { shop: { select: { ownerId: true } } },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const qty = Number(quantity);
  if (!(qty > 0)) {
    throw new ApiError(400, 'Restock quantity must be greater than 0', [], '', 'INVALID_RESTOCK_QUANTITY');
  }

  // A restock is a buy-in, so it is also a costed event: the InventoryBatch row is
  // what the shop's cost/margin reporting reads. Written in the same transaction as
  // the stock bump so stock can never move without its matching batch record.
  // Attributed to the shop's owner (not the caller) so an admin restocking on a
  // seller's behalf still lands in that seller's books.
  const bp = buyPrice !== undefined ? Number(buyPrice) : product.buyPrice || 0;

  const [updated, batch] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { stock: { increment: qty } },
      include: { images: true },
    }),
    prisma.inventoryBatch.create({
      data: {
        userId: product.shop.ownerId,
        shopId: product.shopId,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unit: product.unit || 'pcs',
        buyPrice: bp,
        totalCost: qty * bp,
        note: note || '',
      },
    }),
  ]);

  return { ...updated, batch };
};

// The read side of the restock log — without it InventoryBatch rows would be
// write-only. Owner-scoped, same as the shop's orders and sales listings.
const getShopInventoryBatches = async (shopId, userId, { page = 1, limit = 50, productId } = {}) => {
  await assertShopOwnership(shopId, userId);

  const where = { shopId };
  if (productId) where.productId = productId;

  const take = clampLimit(limit, 50);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;

  const [batches, total] = await Promise.all([
    prisma.inventoryBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.inventoryBatch.count({ where }),
  ]);

  return { batches, total, page: currentPage, pages: Math.ceil(total / take), limit: take };
};

const deleteProduct = async (id, userId, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    Object.assign(where, ownedBy(userId));
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');

  // OrderItem, CartItem and InventoryBatch reference a product with RESTRICT, so a
  // hard delete would fail (and previously that FK error was masked as a misleading
  // 404). When any such history exists, archive the product (isActive=false) instead:
  // it disappears from catalogs but order/inventory history stays intact. Only a
  // product with no references is removed outright.
  const [orderItems, cartItems, inventoryBatches] = await Promise.all([
    prisma.orderItem.count({ where: { productId: id } }),
    prisma.cartItem.count({ where: { productId: id } }),
    prisma.inventoryBatch.count({ where: { productId: id } }),
  ]);

  if (orderItems || cartItems || inventoryBatches) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: "Mahsulot arxivlandi (unga bog'liq tarix mavjud)", archived: true };
  }

  try {
    await prisma.product.delete({ where: { id } });
    return { message: "Mahsulot o'chirildi" };
  } catch (err) {
    if (err.code === 'P2025') throw new ApiError(404, 'Product not found');
    // Race: a referencing row appeared between the check and the delete → archive.
    if (err.code === 'P2003' || /foreign key|violates|restrict|23503|23001/i.test(String(err.message))) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return { message: "Mahsulot arxivlandi (unga bog'liq tarix mavjud)", archived: true };
    }
    throw err;
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

  return review;
};

// Categories power the marketplace browse filter, so they are aggregated over
// the same set browseProducts can return — not over archived or blocked rows.
const getCategories = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true, shop: { isBlocked: false } },
    select: { category: true },
    distinct: ['category'],
  });
  return products.map(p => p.category).filter(Boolean).sort();
};

module.exports = {
  browseProducts,
  getShopProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  restockProduct,
  getShopInventoryBatches,
  deleteProduct,
  addReview,
  getCategories,
};
