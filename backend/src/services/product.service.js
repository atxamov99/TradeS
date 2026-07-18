const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');
const { clampLimit } = require('../utils/pagination');
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');
const { scopeToOwnerOrShop, assertShopMember, assertShopOwner, getUserShopIds } = require('../utils/shopAccess');

const getProducts = async (userId, queryParams = {}, options = {}) => {
  const { search, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc', scope } = queryParams;
  const { isAdmin = false } = options;

  // Default: shared global catalog (every authenticated user sees every
  // product) — mobile sync (pullProductCatalog) depends on this exact
  // behavior, so it must stay the default. Archived products (isActive=false)
  // are always hidden. Passing scope=shop opts into the POS view: only
  // products owned directly by the caller or by a shop they belong to.
  const where = { isActive: true };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (scope === 'shop' && !isAdmin) {
    Object.assign(where, await scopeToOwnerOrShop(userId));
  }

  const take = clampLimit(limit, 50);
  const skip = (Number(page) - 1) * take;
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
  // Default: global catalog (any authenticated user can view any product by
  // id). Passing scope=shop opts into the POS view — 404s if the product
  // isn't owned by the caller or one of their shops.
  const { scope, isAdmin = false } = options;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      reviews: true,
    },
  });

  if (!product) throw new ApiError(404, 'Product not found');
  if (scope === 'shop' && !isAdmin && !(await isProductInScope(product, userId))) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

const getProductBySlug = async (slug, userId, options = {}) => {
  const { scope, isAdmin = false } = options;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, reviews: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (scope === 'shop' && !isAdmin && !(await isProductInScope(product, userId))) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

// Whether `product` belongs to `userId` directly (legacy ownerId) or via a
// shop `userId` is a member of.
const isProductInScope = async (product, userId) => {
  if (product.ownerId === userId) return true;
  if (!product.shopId) return false;
  const shopIds = await getUserShopIds(userId);
  return shopIds.includes(product.shopId);
};

const createProduct = async (productData, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });
  assertTestUserWithinLimits(user);

  // images is a relation (ProductImage[]) — Prisma needs { create: [...] }, not a raw array
  const { images = [], shopId, ...rest } = productData;
  if (rest.unit === 'box' && !(Number(rest.bagWeightKg) > 0)) {
    throw new ApiError(400, 'Bag weight (kg) is required', [], '', 'BAG_WEIGHT_REQUIRED');
  }
  if (shopId) {
    const member = await assertShopMember(shopId, userId);
    if (!member) throw new ApiError(403, 'Not a member of this shop');
  }
  const slug = slugify(rest.name, { lower: true, strict: true }) + '-' + Date.now();
  const finalPrice = rest.price - (rest.price * (rest.discount || 0)) / 100;

  const product = await prisma.product.create({
    data: {
      ...rest,
      slug,
      finalPrice,
      ownerId: userId,
      createdById: userId,
      shopId: shopId || null,
      images: { create: images.map((img) => ({ url: img.url, alt: img.alt || '' })) },
    },
    include: { images: true },
  });

  if (user.isTestUser) {
    await prisma.user.update({ where: { id: userId }, data: { testActionCount: { increment: 1 } } });
  }

  return product;
};

// Shop products may only be modified/restocked/deleted by the shop's OWNER —
// a CASHIER can sell but not edit the catalog. Legacy products (no shopId)
// keep the original single-owner check (already enforced by the caller's
// scopeToOwnerOrShop `where` clause, since there's no shop membership to
// distinguish roles).
const assertProductWriteAccess = async (product, userId, isAdmin) => {
  if (isAdmin || !product.shopId) return;
  const isOwner = await assertShopOwner(product.shopId, userId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can modify this product');
};

const updateProduct = async (id, userId, updateData, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    Object.assign(where, await scopeToOwnerOrShop(userId));
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');
  await assertProductWriteAccess(product, userId, isAdmin);

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

const restockProduct = async (id, userId, quantity, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    Object.assign(where, await scopeToOwnerOrShop(userId));
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');
  await assertProductWriteAccess(product, userId, isAdmin);

  const qty = Number(quantity);
  if (!(qty > 0)) {
    throw new ApiError(400, 'Restock quantity must be greater than 0', [], '', 'INVALID_RESTOCK_QUANTITY');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { stock: { increment: qty } },
    include: { images: true },
  });

  return updated;
};

const deleteProduct = async (id, userId, options = {}) => {
  const { isAdmin = false } = options;
  const where = { id };
  if (!isAdmin && userId) {
    Object.assign(where, await scopeToOwnerOrShop(userId));
  }

  const product = await prisma.product.findFirst({ where });
  if (!product) throw new ApiError(404, 'Product not found');
  await assertProductWriteAccess(product, userId, isAdmin);

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

  // Calculate average rating
  const reviews = await prisma.review.findMany({ where: { productId } });
  const count = reviews.length;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  // We might want to update the Product model if it had cached ratings
  // But our Prisma schema didn't have rating.average fields, I should check it.
  // Actually, I'll just return the review or product.

  return review;
};

const getCategories = async () => {
  // Global catalog: categories are aggregated across all products.
  const products = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  return products.map(p => p.category).filter(Boolean).sort();
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
  addReview,
  getCategories,
};
