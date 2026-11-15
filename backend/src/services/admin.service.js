const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const { clampLimit } = require('../utils/pagination');
const { canonicalPhone, phoneTaken } = require('./auth.service');
const { createAuditLog } = require('./audit.service');
const { deriveKind, kindShopName } = require('../utils/accountKind');

const stripPassword = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

const stripPasswordMany = (users) => users.map(stripPassword);

const DAYS_UZ = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const getDashboardStats = async () => {
  const now = new Date();

  // Last 7 days range
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Last 6 months range
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueResult,
    recentOrders,
    ordersByStatusRaw,
    weeklyUsersRaw,
    monthlyOrdersRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER', deletedAt: null } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: 'paid' },
      _sum: { totalPrice: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { _all: true },
    }),
    // Weekly user registrations (simplified for Prisma)
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, role: 'USER', deletedAt: null },
      select: { createdAt: true },
    }),
    // Monthly orders + revenue (simplified for Prisma)
    prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalPrice: true },
    }),
  ]);

  const totalRevenue = revenueResult._sum.totalPrice || 0;
  const ordersByStatus = ordersByStatusRaw.map(s => ({ _id: s.orderStatus, count: s._count._all }));

  // Build weekly chart
  const weeklyMap = {};
  weeklyUsersRaw.forEach(u => {
    const day = u.createdAt.getDay(); // 0-6
    weeklyMap[day] = (weeklyMap[day] || 0) + 1;
  });
  const weeklyUsers = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);
    const dow = date.getDay();
    return {
      day: DAYS_UZ[dow],
      users: weeklyMap[dow] || 0,
      active: Math.round((weeklyMap[dow] || 0) * 0.75),
    };
  });

  // Build monthly chart
  const monthlyMap = {};
  monthlyOrdersRaw.forEach(o => {
    const key = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`;
    if (!monthlyMap[key]) monthlyMap[key] = { orders: 0, revenue: 0 };
    monthlyMap[key].orders++;
    monthlyMap[key].revenue += o.totalPrice;
  });
  const monthlyOrders = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const entry = monthlyMap[key] || { orders: 0, revenue: 0 };
    return {
      month: MONTHS_UZ[date.getMonth()],
      orders: entry.orders,
      revenue: entry.revenue,
    };
  });

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
    ordersByStatus,
    weeklyUsers,
    monthlyOrders,
  };
};

const getAllUsers = async ({ page = 1, limit = 20, search, role } = {}) => {
  const take = clampLimit(limit, 20);
  const skip = (Number(page) - 1) * take;
  const where = { deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { shopMemberships: { include: { shop: { select: { id: true, name: true, isBusiness: true } } } } },
    }),
    prisma.user.count({ where }),
  ]);

  // what each account IS (user / director / cashier / admin) and which shop explains it
  const withKind = users.map((u) => {
    const { shopMemberships, ...rest } = u;
    const accountKind = deriveKind(u, shopMemberships);
    return { ...rest, accountKind, shopName: kindShopName(accountKind, shopMemberships) };
  });

  return { users: stripPasswordMany(withKind), total, page: Number(page), pages: Math.ceil(total / take) };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new ApiError(404, 'User not found');
  return stripPassword(user);
};

// There is exactly one ADMIN account system-wide (owner decision) and no HTTP path
// grants it — bootstrapping/recovering the admin account is CLI-only (seedAdmin.js).
// So user-management endpoints can never assign anything but USER.
// The MAIN admin is the oldest ADMIN account. Only the main admin may add admins, change an admin account,
// block / unblock / revoke other admins; nobody (not even another admin) may touch the main admin.
const getPrimaryAdminId = async () => {
  const first = await prisma.user.findFirst({ where: { role: 'ADMIN', deletedAt: null }, orderBy: { createdAt: 'asc' }, select: { id: true } });
  return first ? first.id : null;
};

const resolveAssignableRole = async (requestedRole, actorId) => {
  const role = (requestedRole || 'USER').toUpperCase();
  if (role === 'USER') return role;
  if (role === 'ADMIN') {
    if (!actorId || actorId !== (await getPrimaryAdminId())) {
      throw new ApiError(403, 'Only the main admin can add admins');
    }
    return role;
  }
  throw new ApiError(403, 'This role cannot be assigned');
};

const createUserByAdmin = async ({ name, email, password, phone, role }, actorRole, actorId) => {
  // Email mavjud bo'lsa, takrorlanishni tekshir
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan');
  }

  // Telefon mavjud bo'lsa, takrorlanishni tekshir
  if (phone) {
    const canon = canonicalPhone(phone);
    if (!canon) throw new ApiError(400, "Telefon raqam noto'g'ri");
    if (await phoneTaken(canon, '')) throw new ApiError(409, "Bu telefon raqam allaqachon ro'yxatdan o'tgan");
    phone = canon;
  }

  if (!email && !phone) {
    throw new ApiError(400, 'Email yoki telefon raqam talab qilinadi');
  }

  if (!password) {
    throw new ApiError(400, 'Parol talab qilinadi');
  }

  const assignedRole = await resolveAssignableRole(role, actorId);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email: email || null,
      password: hashedPassword,
      phone: phone || null,
      role: assignedRole,
    },
  });
  if (assignedRole === 'ADMIN') {
    createAuditLog({ action: 'ADMIN_CREATED', category: 'admin', actor: actorId, actorId, target: 'user:' + user.id, targetId: user.id }).catch(() => {});
  }

  return stripPassword(user);
};

const updateUserByAdmin = async (userId, data, actorRole, actorId) => {
  const { name, email, phone, role, password } = data;

  // An ADMIN may not edit another ADMIN account, nor assign elevated roles (privilege escalation guard)
  await assertCanActOn(userId, actorRole, actorId);

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = await resolveAssignableRole(role, actorId);
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  try {
    const user = await prisma.user.update({ where: { id: userId }, data: updateData });
    return stripPassword(user);
  } catch (err) {
    console.error('Prisma update error:', err);
    if (err.code === 'P2002') throw new ApiError(409, 'Email already in use');
    if (err.code === 'P2025') throw new ApiError(404, 'User not found');
    throw err;
  }
};

// An ADMIN may never act on another ADMIN account. With exactly one ADMIN allowed
// system-wide this should be unreachable in practice — it's a defense-in-depth
// guard in case that invariant is ever violated (e.g. a data issue), not a tier check.
const assertCanActOn = async (targetId, actorRole, actorId) => {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.role === 'ADMIN') {
    const primary = await getPrimaryAdminId();
    if (!actorId || actorId !== primary || targetId === primary) {
      throw new ApiError(403, 'Only the main admin can manage other admins (and the main admin cannot be changed)');
    }
  }
};

const blockUser = async (userId, adminId, actorRole) => {
  if (userId === adminId) {
    throw new ApiError(400, 'You cannot block yourself');
  }
  await assertCanActOn(userId, actorRole, adminId);
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });
    return stripPassword(user);
  } catch (err) {
    if (err.code === 'P2025') throw new ApiError(404, 'User not found');
    throw err;
  }
};

const unblockUser = async (userId, actorRole, actorId) => {
  // An ADMIN may not act on another ADMIN account (privilege escalation guard)
  await assertCanActOn(userId, actorRole, actorId);
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });
    return stripPassword(user);
  } catch (err) {
    if (err.code === 'P2025') throw new ApiError(404, 'User not found');
    throw err;
  }
};

// A hard delete is blocked by any related record whose FK uses RESTRICT/NO ACTION
// (Sale, Order, InventoryBatch, SyncQueue all have a required userId with no
// onDelete). Products (owner/createdBy) would only be orphaned (SetNull), but we
// also refuse then so ownership/financial attribution isn't silently lost.
// Detects both Prisma's normalized P2003 and a raw Postgres FK error
// (23503 = foreign_key_violation, 23001 = restrict_violation) that can slip past
// Prisma's normalization as a ConnectorError.
const isForeignKeyViolation = (err) => {
  const code = err?.code;
  if (code === 'P2003' || code === '23503' || code === '23001') return true;
  const msg = String(err?.message || '');
  return /foreign key constraint|violates .*constraint|restrict|23503|23001/i.test(msg);
};

// Soft-delete a user by tombstoning their identity: clears the account from active
// lookups (deletedAt), blocks it, revokes sessions, and frees up the email/phone so
// the same person can register a fresh account later. Linked financial history
// (sales, orders, products, inventory) is preserved because the User row stays.
const softDeleteUser = async (user) => {
  if (user.deletedAt) return { message: 'User already deleted', softDeleted: true };
  // Prefix originals so they no longer match active lookups but stay recoverable.
  const tombstonedEmail = user.email ? `deleted_${user.id}_${user.email}` : null;
  const tombstonedPhone = user.phone ? `deleted_${user.id}_${user.phone}` : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        isBlocked: true,
        email: tombstonedEmail,
        phone: tombstonedPhone,
      },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    }),
  ]);

  return { message: 'User soft-deleted (linked history preserved)', softDeleted: true };
};

const deleteUser = async (userId, adminId, actorRole) => {
  if (userId === adminId) {
    throw new ApiError(400, 'You cannot delete yourself');
  }
  await assertCanActOn(userId, actorRole, adminId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.deletedAt) throw new ApiError(404, 'User not found');

  // Does the user own records that a hard delete would either destroy or be blocked
  // by (Sale/Order/InventoryBatch/SyncQueue are RESTRICT; Product would be orphaned)?
  const [salesCount, ordersCount, productsCount, inventoryCount, syncCount] = await Promise.all([
    prisma.sale.count({ where: { userId } }),
    prisma.order.count({ where: { userId } }),
    prisma.product.count({ where: { OR: [{ ownerId: userId }, { createdById: userId }] } }),
    prisma.inventoryBatch.count({ where: { userId } }),
    prisma.syncQueue.count({ where: { userId } }),
  ]);
  const hasHistory = salesCount || ordersCount || productsCount || inventoryCount || syncCount;

  if (!hasHistory) {
    // Clean account — remove it outright.
    try {
      await prisma.user.delete({ where: { id: userId } });
      return { message: 'User deleted successfully' };
    } catch (err) {
      if (err.code === 'P2025') throw new ApiError(404, 'User not found');
      // Race: history appeared between the check and the delete → fall back to soft delete.
      if (!isForeignKeyViolation(err)) throw err;
    }
  }

  // Has history (or lost a race) → preserve it via soft delete.
  return softDeleteUser(user);
};

const getAllAdmins = async ({ page = 1, limit = 50 } = {}) => {
  const take = clampLimit(limit, 20);
  const skip = (Number(page) - 1) * take;
  const where = { role: 'ADMIN', deletedAt: null };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.user.count({ where }),
  ]);

  const primary = await getPrimaryAdminId();
  return { users: stripPasswordMany(users).map((u) => ({ ...u, isMainAdmin: u.id === primary })), mainAdminId: primary, total, page: Number(page), pages: Math.ceil(total / take) };
};

const toggleAdminStatus = async (userId, adminId, actorRole) => {
  if (userId === adminId) throw new ApiError(400, 'You cannot change your own status');
  // An ADMIN may not suspend/reinstate another ADMIN (privilege escalation guard)
  await assertCanActOn(userId, actorRole, adminId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    throw new ApiError(404, 'Admin not found');
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: !user.isBlocked },
  });
  return stripPassword(updated);
};

const getAllOrders = async ({ page = 1, limit = 20, status } = {}) => {
  const take = clampLimit(limit, 20);
  const skip = (Number(page) - 1) * take;
  const where = {};
  if (status) where.orderStatus = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page: Number(page), pages: Math.ceil(total / take) };
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  assertCanActOn,
  resolveAssignableRole,
  createUserByAdmin,
  updateUserByAdmin,
  blockUser,
  unblockUser,
  deleteUser,
  getAllAdmins,
  toggleAdminStatus,
  getAllOrders,
};
