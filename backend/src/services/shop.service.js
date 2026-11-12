const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');
const { assertShopMember, assertShopOwner } = require('../utils/shopAccess');
const telegramService = require('./telegram.service');
const emailService = require('./email.service');
const { createAuditLog } = require('./audit.service');

const UPGRADE_CODE_TTL_MIN = 10;
const UPGRADE_MAX_ATTEMPTS = 5;
const hashCode = (shopId, code) => crypto.createHash('sha256').update(`${shopId}:${code}`).digest('hex');

// A personal (solo) shop has no employees: members/cashiers are a business feature.
const assertBusinessShop = async (shopId) => {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { isBusiness: true } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (!shop.isBusiness) {
    throw new ApiError(409, 'Upgrade to a business account to manage employees', [], '', 'PERSONAL_SHOP');
  }
};

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
  await assertBusinessShop(shopId);

  return prisma.shopMember.findMany({
    where: { shopId },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
};

const addMember = async (shopId, requesterId, { userId, phone, email, role }) => {
  const isOwner = await assertShopOwner(shopId, requesterId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can add members');
  await assertBusinessShop(shopId);

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

// ── Solo -> Business upgrade (confirmed with a one-time code) ────────────────
// Step 1: owner of a PERSONAL shop asks for a code; it is sent to the owner's
// linked Telegram (same channel as the new-device challenge) or, failing that,
// to their email. Only a hash is stored; valid for UPGRADE_CODE_TTL_MIN minutes.
const requestBusinessUpgrade = async (shopId, userId) => {
  if (!(await assertShopOwner(shopId, userId))) throw new ApiError(403, 'Only the shop owner can do this', [], '', 'OWNER_ONLY');
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.isBusiness) throw new ApiError(409, 'This shop is already a business', [], '', 'ALREADY_BUSINESS');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, email: true } });
  const code = String(crypto.randomInt(100000, 1000000));
  await prisma.shop.update({
    where: { id: shopId },
    data: {
      upgradeCodeHash: hashCode(shopId, code),
      upgradeCodeExpiresAt: new Date(Date.now() + UPGRADE_CODE_TTL_MIN * 60 * 1000),
      upgradeAttempts: 0,
    },
  });

  let channel = null;
  const phone = user.phone ? telegramService.normalizePhone(user.phone) : null;
  const tg = phone ? await prisma.phoneAuth.findUnique({ where: { phone } }) : null;
  if (tg && tg.telegramChatId) {
    await telegramService.sendMessage(
      tg.telegramChatId,
      `\u{1F3E2} <b>TradeS</b> \u2014 biznes hisobiga o'tish\n\nTasdiqlash kodi: <b>${code}</b>\nKod ${UPGRADE_CODE_TTL_MIN} daqiqa amal qiladi. Hech kimga bermang.`
    );
    channel = 'telegram';
  } else if (user.email && emailService.isConfigured()) {
    await emailService.sendCode(user.email, code);
    channel = 'email';
  }

  const result = { channel, expiresInMinutes: UPGRADE_CODE_TTL_MIN };
  if (!channel) {
    // No delivery channel. In production that is an error; in dev we hand the code back.
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(400, 'No verified channel (Telegram or email) to send the code', [], '', 'NO_CODE_CHANNEL');
    }
    result.devCode = code;
  }
  return result;
};

// Step 2: verify the code, flip the shop to a business (optionally renaming it).
const confirmBusinessUpgrade = async (shopId, userId, { code, name }, meta = {}) => {
  if (!(await assertShopOwner(shopId, userId))) throw new ApiError(403, 'Only the shop owner can do this', [], '', 'OWNER_ONLY');
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.isBusiness) throw new ApiError(409, 'This shop is already a business', [], '', 'ALREADY_BUSINESS');
  if (!shop.upgradeCodeHash || !shop.upgradeCodeExpiresAt) throw new ApiError(400, 'Request a code first', [], '', 'NO_CODE_REQUESTED');
  if (shop.upgradeCodeExpiresAt < new Date()) throw new ApiError(400, 'The code has expired - request a new one', [], '', 'CODE_EXPIRED');
  if (shop.upgradeAttempts >= UPGRADE_MAX_ATTEMPTS) throw new ApiError(429, 'Too many wrong codes - request a new one', [], '', 'TOO_MANY_ATTEMPTS');

  const given = Buffer.from(hashCode(shopId, String(code).trim()));
  const expected = Buffer.from(shop.upgradeCodeHash);
  const ok = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) {
    await prisma.shop.update({ where: { id: shopId }, data: { upgradeAttempts: { increment: 1 } } });
    throw new ApiError(400, 'Wrong code', [], '', 'WRONG_CODE');
  }

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      isBusiness: true,
      ...(name ? { name } : {}),
      upgradeCodeHash: null,
      upgradeCodeExpiresAt: null,
      upgradeAttempts: 0,
    },
  });
  await createAuditLog({
    action: 'SHOP_UPGRADE_BUSINESS', category: 'user', actor: userId, actorId: userId,
    target: `shop:${shopId}`, targetId: shopId, ip: meta.ip || '', metadata: { name: updated.name },
  }).catch(() => {});
  return updated;
};

module.exports = { createShop, getMyShops, getShopMembers, addMember, removeMember, requestBusinessUpgrade, confirmBusinessUpgrade };
