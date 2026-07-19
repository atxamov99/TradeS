const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { assertShopMember, assertShopOwner } = require('../utils/shopAccess');

const createShop = async (userId, { name }) => {
  return prisma.shop.create({
    data: {
      name,
      ownerId: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
    include: { members: true },
  });
};

// Shops the user belongs to, with their role in each.
const getMyShops = async (userId) => {
  const memberships = await prisma.shopMember.findMany({
    where: { userId },
    include: { shop: true },
  });
  return memberships.map((m) => ({ ...m.shop, myRole: m.role }));
};

const getShopMembers = async (shopId, userId) => {
  const member = await assertShopMember(shopId, userId);
  if (!member) throw new ApiError(403, 'Not a member of this shop');

  return prisma.shopMember.findMany({
    where: { shopId },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
};

const addMember = async (shopId, requesterId, { userId, phone, email, role }) => {
  const isOwner = await assertShopOwner(shopId, requesterId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can add members');

  let targetUser;
  if (userId) {
    targetUser = await prisma.user.findUnique({ where: { id: userId } });
  } else if (phone) {
    targetUser = await prisma.user.findFirst({ where: { phone } });
  } else if (email) {
    targetUser = await prisma.user.findFirst({ where: { email } });
  }
  if (!targetUser) throw new ApiError(404, 'User not found');

  const existing = await assertShopMember(shopId, targetUser.id);
  if (existing) throw new ApiError(409, 'User is already a member of this shop');

  return prisma.shopMember.create({
    data: { shopId, userId: targetUser.id, role: role || 'CASHIER' },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
};

const removeMember = async (shopId, requesterId, targetUserId) => {
  const isOwner = await assertShopOwner(shopId, requesterId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can remove members');
  if (targetUserId === requesterId) throw new ApiError(400, "Owner can't remove themselves");

  await prisma.shopMember.delete({
    where: { shopId_userId: { shopId, userId: targetUserId } },
  });
  return { message: 'Member removed' };
};

module.exports = { createShop, getMyShops, getShopMembers, addMember, removeMember };
