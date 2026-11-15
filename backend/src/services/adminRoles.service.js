const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const adminService = require('./admin.service');
const { createAuditLog } = require('./audit.service');
const { deriveKind } = require('../utils/accountKind');

const KINDS = ['USER', 'DIRECTOR', 'CASHIER', 'ADMIN'];

// Business shops an admin can attach a cashier to.
const listBusinessShops = async () => {
  const shops = await prisma.shop.findMany({
    where: { isBusiness: true },
    select: { id: true, name: true, owner: { select: { name: true } } },
    orderBy: { name: 'asc' },
    take: 500,
  });
  return shops.map((s) => ({ id: s.id, name: s.name, ownerName: s.owner?.name || '' }));
};

/**
 * Change what an account is. A "role" here is really an account kind, made of the platform role
 * (USER / ADMIN) plus the shop memberships:
 *   ADMIN    - platform role ADMIN (main admin only, same rule as everywhere else)
 *   DIRECTOR - owner of a business shop (a personal shop is upgraded, or a new business shop is created)
 *   CASHIER  - cashier of the chosen business shop (needs shopId)
 *   USER     - works for themselves (back to a personal account)
 * Nothing is destroyed silently: a director with employees, or a person with a shop that holds data,
 * cannot be turned into something else until that is dealt with (clear 409).
 */
const setAccountKind = async (userId, { kind, shopId }, actorId) => {
  if (!KINDS.includes(kind)) throw new ApiError(400, 'Unknown role');
  if (userId === actorId) throw new ApiError(400, 'You cannot change your own role');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shopMemberships: { include: { shop: true } } },
  });
  if (!user || user.deletedAt) throw new ApiError(404, 'User not found');

  // an ADMIN account can only be touched by the main admin (never the main admin itself)
  await adminService.assertCanActOn(userId, 'ADMIN', actorId);

  const before = deriveKind(user, user.shopMemberships);
  if (before === kind && !(kind === 'CASHIER' && shopId && !user.shopMemberships.some((m) => m.shopId === shopId))) {
    return { kind, changed: false };
  }

  if (kind === 'ADMIN') {
    await adminService.resolveAssignableRole('ADMIN', actorId); // main admin only
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
  } else {
    await prisma.$transaction(async (tx) => {
      if (user.role === 'ADMIN') await tx.user.update({ where: { id: userId }, data: { role: 'USER' } });

      const owned = user.shopMemberships.filter((m) => m.role === 'OWNER').map((m) => m.shop);
      const countOthers = (id) => tx.shopMember.count({ where: { shopId: id, userId: { not: userId } } });
      const hasData = async (id) => {
        const [p, s, e] = await Promise.all([
          tx.product.count({ where: { shopId: id } }),
          tx.sale.count({ where: { shopId: id } }),
          tx.expense.count({ where: { shopId: id } }),
        ]);
        return p + s + e > 0;
      };

      if (kind === 'USER') {
        for (const shop of owned.filter((s) => s.isBusiness)) {
          if ((await countOthers(shop.id)) > 0) {
            throw new ApiError(409, 'This director has employees: remove them first', [], '', 'DIRECTOR_HAS_STAFF');
          }
          await tx.shop.update({ where: { id: shop.id }, data: { isBusiness: false } });
        }
        await tx.shopMember.deleteMany({ where: { userId, role: 'CASHIER' } });
      }

      if (kind === 'DIRECTOR') {
        if (!owned.some((s) => s.isBusiness)) {
          const personal = owned[0];
          if (personal) {
            await tx.shop.update({ where: { id: personal.id }, data: { isBusiness: true } });
          } else {
            await tx.shop.create({
              data: { name: (user.name || 'Do\'kon') + " do'koni", ownerId: userId, isBusiness: true, members: { create: { userId, role: 'OWNER' } } },
            });
          }
        }
        await tx.shopMember.deleteMany({ where: { userId, role: 'CASHIER' } });
      }

      if (kind === 'CASHIER') {
        if (!shopId) throw new ApiError(400, 'Choose the shop this cashier works in', [], '', 'SHOP_REQUIRED');
        const shop = await tx.shop.findUnique({ where: { id: shopId } });
        if (!shop || !shop.isBusiness) throw new ApiError(404, 'Business shop not found');
        if (shop.ownerId === userId) throw new ApiError(400, 'The owner of a shop cannot be its cashier');
        for (const mine of owned) {
          if ((await countOthers(mine.id)) > 0 || (await hasData(mine.id))) {
            throw new ApiError(409, 'This person has their own shop with data or staff: it cannot become a cashier', [], '', 'HAS_OWN_SHOP_DATA');
          }
          await tx.shop.delete({ where: { id: mine.id } });
        }
        await tx.shopMember.deleteMany({ where: { userId, role: 'CASHIER', shopId: { not: shopId } } });
        const exists = await tx.shopMember.findUnique({ where: { shopId_userId: { shopId, userId } } });
        if (!exists) await tx.shopMember.create({ data: { shopId, userId, role: 'CASHIER' } });
      }
    });
  }

  await createAuditLog({
    action: 'ROLE_CHANGED', category: 'admin', actor: actorId, actorId, target: 'user:' + userId, targetId: userId,
    metadata: { from: before, to: kind, shopId: shopId || null },
  }).catch(() => {});

  const fresh = await prisma.user.findUnique({ where: { id: userId }, include: { shopMemberships: { include: { shop: true } } } });
  return { kind: deriveKind(fresh, fresh.shopMemberships), changed: true };
};

module.exports = { setAccountKind, listBusinessShops, KINDS };
