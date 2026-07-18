const prisma = require('../config/prisma');

// Shop ids the user belongs to (as OWNER or CASHIER).
const getUserShopIds = async (userId) => {
  const memberships = await prisma.shopMember.findMany({
    where: { userId },
    select: { shopId: true },
  });
  return memberships.map((m) => m.shopId);
};

// Prisma where-fragment for "rows this user may act on": either the legacy
// direct-ownership field (ownerId/userId — pre-Shop, single-tenant accounts)
// OR any shop the user is a member of. Additive — doesn't break rows that
// were never assigned to a shop.
const scopeToOwnerOrShop = async (userId, ownerField = 'ownerId') => {
  const shopIds = await getUserShopIds(userId);
  const or = [{ [ownerField]: userId }];
  if (shopIds.length) or.push({ shopId: { in: shopIds } });
  return { OR: or };
};

const assertShopMember = async (shopId, userId) => {
  const member = await prisma.shopMember.findUnique({
    where: { shopId_userId: { shopId, userId } },
  });
  return member;
};

const assertShopOwner = async (shopId, userId) => {
  const member = await assertShopMember(shopId, userId);
  return member && member.role === 'OWNER';
};

module.exports = { getUserShopIds, scopeToOwnerOrShop, assertShopMember, assertShopOwner };
