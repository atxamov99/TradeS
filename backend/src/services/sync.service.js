const prisma = require('../config/prisma');
const saleService = require('./sale.service');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');
const { assertTestUserWithinLimits } = require('../utils/testUserLimits');

// Fields a mobile client is allowed to set on a product via sync. Everything else
// (ownerId, createdById, slug, finalPrice, isActive, id, timestamps) is server-owned
// and must never be taken from the client payload — otherwise a device could spoof
// ownership, resurrect archived products, or inject stock/price for another tenant.
const PRODUCT_SYNC_FIELDS = [
  'name', 'buyPrice', 'sellPrice', 'unit', 'description',
  'price', 'discount', 'category', 'stock', 'brand', 'tags', 'bagWeightKg',
];

// Mobile clients send stock as `quantity`; normalize to the `stock` column name
// before whitelisting so it isn't silently dropped.
const normalizeProductPayload = (payload = {}) =>
  payload.quantity !== undefined && payload.stock === undefined
    ? { ...payload, stock: payload.quantity }
    : payload;

// Keep only whitelisted keys from an untrusted client payload.
const pickAllowed = (payload = {}, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) out[key] = payload[key];
  }
  return out;
};

/**
 * Process a batch of offline operations from mobile client.
 */
const processSyncBatch = async (userId, operations) => {
  const results = [];

  // userId is constant across the whole batch, so fetch the test-account
  // fields once rather than per-operation. The in-memory `user.testActionCount`
  // is incremented alongside each DB increment below, so the cap is enforced
  // correctly even for many creates within a single batch.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true, testExpiresAt: true, testActionCount: true },
  });

  for (const op of operations) {
    const { operation, entity, entityId, payload, clientUpdatedAt } = op;

    try {
      let serverEntityId;

      if (entity === 'sale' && operation === 'create') {
        const sale = await saleService.createSale(userId, {
          ...payload,
          syncId: entityId,
          isFromOffline: true,
        });
        serverEntityId = sale.id;
      }

      else if (entity === 'product') {
        if (operation === 'create') {
          assertTestUserWithinLimits(user);

          // Idempotency key is the client-generated id (payload.id === entityId,
          // stable across retries of the same queued op), not the product name --
          // matching by name would silently merge two genuinely different
          // products that happen to share one into a single server row.
          const existing = await prisma.product.findFirst({
            where: { id: payload.id, createdById: userId }
          });
          if (!existing) {
            // Only trust whitelisted fields from the client; server sets ownership/derived fields.
            const safe = pickAllowed(normalizeProductPayload(payload), PRODUCT_SYNC_FIELDS);
            const slug = slugify(safe.name, { lower: true, strict: true }) + '-' + Date.now();
            const basePrice = safe.price || 0;
            const finalPrice = basePrice - (basePrice * (safe.discount || 0)) / 100;

            const product = await prisma.product.create({
              data: {
                ...safe,
                buyPrice: Number(safe.buyPrice) || 0,
                sellPrice: Number(safe.sellPrice) || 0,
                stock: Number(safe.stock) || 0,
                bagWeightKg: safe.bagWeightKg != null ? Number(safe.bagWeightKg) : null,
                price: basePrice,
                finalPrice,
                slug,
                createdById: userId,
                ownerId: userId,
                isActive: true,
              },
            });
            serverEntityId = product.id;

            if (user.isTestUser) {
              await prisma.user.update({ where: { id: userId }, data: { testActionCount: { increment: 1 } } });
              // Keep the in-memory count in sync so assertTestUserWithinLimits() caps
              // later creates within this same batch instead of all seeing the stale count.
              user.testActionCount = (user.testActionCount || 0) + 1;
            }
          } else {
            serverEntityId = existing.id;
          }
        }

        else if (operation === 'update') {
          const pId = payload.serverId || entityId;
          // Scope by createdById — a device may only sync-update its own products (prevents IDOR)
          const product = await prisma.product.findFirst({ where: { id: pId, createdById: userId } });
          if (product) {
            const clientTime = clientUpdatedAt ? new Date(clientUpdatedAt) : new Date(0);
            const serverTime = product.updatedAt;
            if (clientTime >= serverTime) {
              // Only trust whitelisted fields — never let the client change ownerId/isActive/slug/finalPrice.
              const updateData = pickAllowed(normalizeProductPayload(payload), PRODUCT_SYNC_FIELDS);

              if (payload.name && payload.name !== product.name) {
                updateData.slug = slugify(payload.name, { lower: true, strict: true }) + '-' + Date.now();
              }
              if (payload.sellPrice !== undefined) {
                updateData.price = Number(payload.sellPrice) || 0;
                const discount = product.discount || 0;
                updateData.finalPrice = updateData.price - (updateData.price * discount) / 100;
              }

              const updated = await prisma.product.update({
                where: { id: pId },
                data: updateData,
              });
              serverEntityId = updated.id;
            } else {
              serverEntityId = product.id;
            }
          }
        }

        else if (operation === 'delete') {
          const pId = payload.serverId || entityId;
          // Scope by createdById — only soft-delete products this device owns (prevents IDOR)
          await prisma.product.updateMany({
            where: { id: pId, createdById: userId },
            data: { isActive: false },
          });
        }
      }

      // Record sync result
      const existingSync = await prisma.syncQueue.findFirst({
        where: { userId, entity, entityId },
      });

      if (existingSync) {
        await prisma.syncQueue.update({
          where: { id: existingSync.id },
          data: {
            operation,
            entity,
            payload,
            serverEntityId,
            status: 'synced',
            attempts: { increment: 1 },
          },
        });
      } else {
        await prisma.syncQueue.create({
          data: {
            userId,
            operation,
            entity,
            entityId,
            payload,
            serverEntityId,
            status: 'synced',
            attempts: 1,
          },
        });
      }

      results.push({ entityId, status: 'synced', serverEntityId });
    } catch (err) {
      const existingSync = await prisma.syncQueue.findFirst({
        where: { userId, entity, entityId },
      });

      if (existingSync) {
        await prisma.syncQueue.update({
          where: { id: existingSync.id },
          data: {
            operation,
            entity,
            payload,
            status: 'failed',
            errorMessage: err.message,
            attempts: { increment: 1 },
          },
        });
      } else {
        await prisma.syncQueue.create({
          data: {
            userId,
            operation,
            entity,
            entityId,
            payload,
            status: 'failed',
            errorMessage: err.message,
            attempts: 1,
          },
        });
      }
      results.push({ entityId, status: 'failed', error: err.message });
    }
  }

  return results;
};

/**
 * Pull latest data for a user's device
 */
const pullData = async (userId, lastSyncAt) => {
  const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

  const [products, sales] = await Promise.all([
    prisma.product.findMany({
      // Scope to this device's own products — never leak other users' catalog (prevents cross-tenant data leak).
      // reviews relation is simply not included (Prisma `omit` only works on scalar fields, not relations).
      where: {
        createdById: userId,
        updatedAt: { gt: since },
      },
    }),
    prisma.sale.findMany({
      where: {
        userId,
        createdAt: { gt: since },
      },
    }),
  ]);

  return {
    products,
    sales,
    serverTime: new Date().toISOString(),
  };
};

module.exports = { processSyncBatch, pullData };
