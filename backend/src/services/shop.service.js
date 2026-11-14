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

// ── Invitations ─────────────────────────────────────────────────────────────
// Nobody is added to a shop directly: the owner INVITES an existing user, and the
// user becomes a member only after accepting (so a wrong phone number or a random
// person can never end up with access to the shop).
const INVITE_USER = { select: { id: true, name: true, phone: true, email: true } };
const INVITE_SHOP = { select: { id: true, name: true } };

const inviteMember = async (shopId, requesterId, { userId, phone, email, role }) => {
  const isOwner = await assertShopOwner(shopId, requesterId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can invite members');
  await assertBusinessShop(shopId);

  let targetUser;
  if (userId) {
    targetUser = await prisma.user.findUnique({ where: { id: userId } });
  } else if (phone) {
    targetUser = await prisma.user.findFirst({ where: { phone } });
  } else if (email) {
    targetUser = await prisma.user.findFirst({ where: { email } });
  }
  // The person must already be registered: we check the database before inviting.
  if (!targetUser) throw new ApiError(404, 'No registered user with these details');
  if (targetUser.id === requesterId) throw new ApiError(400, "You can't invite yourself");
  if (targetUser.role === 'ADMIN') throw new ApiError(400, "This account can't be invited");

  const existing = await assertShopMember(shopId, targetUser.id);
  if (existing) throw new ApiError(409, 'User is already a member of this shop');
  const pending = await prisma.shopInvite.findFirst({
    where: { shopId, invitedUserId: targetUser.id, status: 'PENDING' },
  });
  if (pending) throw new ApiError(409, 'An invitation to this user is already pending');

  const invite = await prisma.shopInvite.create({
    data: { shopId, invitedUserId: targetUser.id, invitedById: requesterId, role: role || 'CASHIER' },
    include: { invitedUser: INVITE_USER, shop: INVITE_SHOP },
  });

  // Best effort: tell them in Telegram if linked (they also see it inside the app/site).
  try {
    const phoneNorm = targetUser.phone ? telegramService.normalizePhone(targetUser.phone) : null;
    const tg = phoneNorm ? await prisma.phoneAuth.findUnique({ where: { phone: phoneNorm } }) : null;
    if (tg && tg.telegramChatId) {
      await telegramService.sendMessage(
        tg.telegramChatId,
        `\u{1F4E8} <b>TradeS</b>\n\n"${invite.shop.name}" do'koniga xodim bo'lish taklifi keldi. Qabul qilish yoki rad etish uchun ilovaga yoki saytga kiring.`
      );
    }
  } catch (_) { /* notification is optional */ }

  return invite;
};

// Owner: pending invitations of the shop.
const listShopInvites = async (shopId, requesterId) => {
  const isOwner = await assertShopOwner(shopId, requesterId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can see invitations');
  return prisma.shopInvite.findMany({
    where: { shopId, status: 'PENDING' },
    include: { invitedUser: INVITE_USER },
    orderBy: { createdAt: 'desc' },
  });
};

// Owner: withdraw a pending invitation.
const cancelInvite = async (shopId, requesterId, inviteId) => {
  const isOwner = await assertShopOwner(shopId, requesterId);
  if (!isOwner) throw new ApiError(403, 'Only the shop owner can cancel invitations');
  const res = await prisma.shopInvite.updateMany({
    where: { id: inviteId, shopId, status: 'PENDING' },
    data: { status: 'CANCELLED', respondedAt: new Date() },
  });
  if (!res.count) throw new ApiError(404, 'Invitation not found');
  return { message: 'Invitation cancelled' };
};

// Invited user: invitations waiting for an answer.
const getMyInvites = async (userId) => {
  return prisma.shopInvite.findMany({
    where: { invitedUserId: userId, status: 'PENDING' },
    include: { shop: INVITE_SHOP, invitedBy: INVITE_USER },
    orderBy: { createdAt: 'desc' },
  });
};

// Invited user: accept or decline. Only the invited user can answer, only once.
const respondToInvite = async (inviteId, userId, accept) => {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'invite:' + inviteId}))`;
    const invite = await tx.shopInvite.findFirst({
      where: { id: inviteId, invitedUserId: userId, status: 'PENDING' },
      include: { shop: { select: { id: true, name: true, isBusiness: true } } },
    });
    if (!invite) throw new ApiError(404, 'Invitation not found or already answered');

    if (!accept) {
      await tx.shopInvite.update({ where: { id: inviteId }, data: { status: 'DECLINED', respondedAt: new Date() } });
      return { message: 'Invitation declined' };
    }

    if (!invite.shop.isBusiness) throw new ApiError(409, 'This shop is no longer a business account');
    const already = await tx.shopMember.findUnique({ where: { shopId_userId: { shopId: invite.shopId, userId } } });
    if (!already) {
      // A cashier must not also look like the owner of an empty auto-created personal shop.
      if (invite.role === 'CASHIER') {
        const owned = await tx.shop.findMany({
          where: { ownerId: userId, isBusiness: false },
          select: { id: true, _count: { select: { products: true, sales: true, expenses: true } } },
        });
        for (const s of owned) {
          const c = s._count;
          if (!c.products && !c.sales && !c.expenses) await tx.shop.delete({ where: { id: s.id } });
        }
      }
      await tx.shopMember.create({ data: { shopId: invite.shopId, userId, role: invite.role } });
    }
    await tx.shopInvite.update({ where: { id: inviteId }, data: { status: 'ACCEPTED', respondedAt: new Date() } });
    return { message: 'Invitation accepted', shop: { id: invite.shop.id, name: invite.shop.name }, role: invite.role };
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

module.exports = { createShop, getMyShops, getShopMembers, inviteMember, listShopInvites, cancelInvite, getMyInvites, respondToInvite, removeMember, requestBusinessUpgrade, confirmBusinessUpgrade };
