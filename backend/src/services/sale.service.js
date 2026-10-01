const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { assertShopOwnership } = require('./shop.service');
const { clampLimit, clampPage } = require('../utils/pagination');
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');

const createSale = async (userId, saleData) => {
  const { shopId, product: productId, productName, quantity, sellPrice, buyPrice, unit, note, syncId, isFromOffline, createdAt } = saleData;

  // Check for duplicate syncId (idempotent offline sync)
  if (syncId) {
    const existing = await prisma.sale.findUnique({ where: { syncId } });
    if (existing) return existing;
  }

  // v1 POS sales are owner-only, so this doubles as the authorization check:
  // you may only record a sale against a shop you own.
  await assertShopOwnership(shopId, userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });
  assertTestUserWithinLimits(user);

  const qty = Number(quantity);
  const sp = Number(sellPrice) || 0;
  const bp = Number(buyPrice) || 0;

  // If a productId is given, it must belong to the same shop — prevents
  // decrementing another shop's stock via a forged productId (IDOR).
  if (productId) {
    const owned = await prisma.product.findFirst({
      where: { id: productId, shopId },
      select: { id: true, stock: true },
    });
    if (!owned) throw new ApiError(404, `Product ${productId} not found`);

    // Block overselling for real-time sales — but offline-synced sales already
    // happened physically before the device reconnected, so they must still be
    // recorded even if stock has since run out (see the note below on negative
    // stock for the offline path).
    if (!isFromOffline && qty > owned.stock) {
      throw new ApiError(400, 'Insufficient stock', [], '', 'INSUFFICIENT_STOCK');
    }
  }

  // Use transaction to ensure both sale creation and stock deduction succeed
  return await prisma.$transaction(async (tx) => {
    // Allow stock to go negative to support offline sales and avoid sync failures
    // (Retail standard: if the item was physically sold, record it and let inventory go negative)

    const sale = await tx.sale.create({
      data: {
        userId,
        shopId,
        productId: productId || null,
        productName,
        quantity: qty,
        sellPrice: sp,
        buyPrice: bp,
        totalRevenue: qty * sp,
        totalCost: qty * bp,
        profit: qty * sp - qty * bp,
        unit,
        note,
        syncId,
        isFromOffline: isFromOffline || false,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      },
    });

    // Deduct stock only after sale is successfully persisted
    if (productId) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: qty } },
      });
    }

    if (user.isTestUser) {
      await tx.user.update({ where: { id: userId }, data: { testActionCount: { increment: 1 } } });
    }

    return sale;
  });
};

const bulkSync = async (userId, sales) => {
  const results = [];
  for (const s of sales) {
    try {
      const sale = await createSale(userId, s);
      results.push({ syncId: s.syncId, serverId: sale.id, status: 'synced' });
    } catch (err) {
      results.push({ syncId: s.syncId, status: 'failed', error: err.message });
    }
  }
  return results;
};

const getSales = async (userId, { shopId, page = 1, limit = 100, from, to, date } = {}) => {
  // userId stays in the filter even when a shop is given: v1 has no employees,
  // so "my sales" and "this shop's sales" are the same set, and keeping both
  // means a future employee sale can't retroactively widen this listing.
  const where = { userId };
  if (shopId) where.shopId = shopId;

  if (date) {
    // Single day filter
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  } else if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const take = clampLimit(limit, 100);
  const currentPage = clampPage(page);
  const skip = (currentPage - 1) * take;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.sale.count({ where }),
  ]);

  return { sales, total, page: currentPage, pages: Math.ceil(total / take) };
};

const getShopSales = async (shopId, userId, queryParams = {}) => {
  await assertShopOwnership(shopId, userId);
  return getSales(userId, { ...queryParams, shopId });
};

module.exports = { createSale, bulkSync, getSales, getShopSales };
