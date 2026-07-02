const prisma = require('../config/prisma');
const saleService = require('./sale.service');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

/**
 * Process a batch of offline operations from mobile client.
 */
const processSyncBatch = async (userId, operations) => {
  const results = [];

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
          const existing = await prisma.product.findFirst({
            where: { name: payload.name, createdById: userId }
          });
          if (!existing) {
            const slug = slugify(payload.name, { lower: true, strict: true }) + '-' + Date.now();
            const finalPrice = payload.price - (payload.price * (payload.discount || 0)) / 100;

            const product = await prisma.product.create({
              data: {
                ...payload,
                slug,
                finalPrice,
                createdById: userId,
                ownerId: userId,
                isActive: true,
              },
            });
            serverEntityId = product.id;
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
              const updateData = { ...payload };
              if (payload.name && payload.name !== product.name) {
                updateData.slug = slugify(payload.name, { lower: true, strict: true }) + '-' + Date.now();
              }
              if (payload.price !== undefined || payload.discount !== undefined) {
                const p = payload.price !== undefined ? payload.price : product.price;
                const d = payload.discount !== undefined ? payload.discount : product.discount;
                updateData.finalPrice = p - (p * d) / 100;
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
