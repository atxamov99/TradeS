const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { clampLimit, clampPage } = require('../utils/pagination');

// Opening a shop is self-serve (no approval step), so the only guard against one
// account farming unlimited storefronts is this app-side cap. Not a DB constraint
// because the number is a product decision that will be raised later.
const MAX_SHOPS_PER_USER = 10;

// Every shop-scoped write in the app funnels through here: it is the single
// place that decides "may this user act on this shop?". Returns the shop so
// callers can read isBlocked/name without a second query.
const assertShopOwnership = async (shopId, userId) => {
  if (!shopId) {
    throw new ApiError(400, 'shopId is required', [], '', 'SHOP_ID_REQUIRED');
  }
  const shop = await prisma.shop.findFirst({ where: { id: shopId, ownerId: userId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.isBlocked) {
    throw new ApiError(403, 'Bu do\'kon bloklangan', [], '', 'SHOP_BLOCKED');
  }
  return shop;
};

const createShop = async (userId, { name, description }) => {
  const existing = await prisma.shop.count({ where: { ownerId: userId } });
  if (existing >= MAX_SHOPS_PER_USER) {
    throw new ApiError(
      400,
      `Bitta hisobda ko'pi bilan ${MAX_SHOPS_PER_USER} ta do'kon bo'lishi mumkin`,
      [],
      '',
      'SHOP_LIMIT_REACHED'
    );
  }

  return prisma.shop.create({
    data: { ownerId: userId, name, description: description || '' },
  });
};

const listMyShops = async (userId) => {
  const shops = await prisma.shop.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return { shops, total: shops.length, max: MAX_SHOPS_PER_USER };
};

// Public detail — used both by the owner's management screen and by a buyer
// browsing the marketplace, so it must not leak anything owner-only.
const getShopById = async (shopId) => {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
  return shop;
};

const listShops = async ({ search, page = 1, limit = 20 } = {}) => {
  const where = { isBlocked: false };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const take = clampLimit(limit, 20);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  return { shops, total, page: currentPage, pages: Math.ceil(total / take), limit: take };
};

const updateShop = async (userId, shopId, { name, description }) => {
  const shop = await prisma.shop.findFirst({ where: { id: shopId, ownerId: userId } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  return prisma.shop.update({ where: { id: shopId }, data });
};

module.exports = {
  MAX_SHOPS_PER_USER,
  assertShopOwnership,
  createShop,
  listMyShops,
  getShopById,
  listShops,
  updateShop,
};
