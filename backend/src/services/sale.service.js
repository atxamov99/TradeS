const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { clampLimit } = require('../utils/pagination');
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');
const { scopeToOwnerOrShop, getUserShopIds } = require('../utils/shopAccess');

const createSale = async (userId, saleData) => {
  const { product: productId, productName, quantity, sellPrice, buyPrice, unit, note, syncId, isFromOffline, createdAt } = saleData;

  // Check for duplicate syncId (idempotent offline sync)
  if (syncId) {
    const existing = await prisma.sale.findUnique({ where: { syncId } });
    if (existing) return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });
  assertTestUserWithinLimits(user);

  const qty = Number(quantity);
  const sp = Number(sellPrice) || 0;
  const bp = Number(buyPrice) || 0;

  // If a productId is given, it must belong to this user (or a shop they're a
  // member of) — prevents decrementing another owner's stock via a forged
  // productId (IDOR).
  let shopId = null;
  if (productId) {
    const ownerScope = await scopeToOwnerOrShop(userId);
    const owned = await prisma.product.findFirst({
      where: { id: productId, ...ownerScope },
      select: { id: true, stock: true, shopId: true },
    });
    if (!owned) throw new ApiError(404, `Product ${productId} not found`);
    shopId = owned.shopId;

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
        cashierId: userId,
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

const getSales = async (userId, { page = 1, limit = 100, from, to, date } = {}) => {
  // Legacy solo accounts only see their own sales; shop members (owner or
  // cashier) see every sale recorded under any shop they belong to, so an
  // owner can see what their cashiers sold.
  const shopIds = await getUserShopIds(userId);
  const where = shopIds.length ? { OR: [{ userId }, { shopId: { in: shopIds } }] } : { userId };

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
  const skip = (Number(page) - 1) * take;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.sale.count({ where }),
  ]);

  return { sales, total, page: Number(page), pages: Math.ceil(total / take) };
};

module.exports = { createSale, bulkSync, getSales };
