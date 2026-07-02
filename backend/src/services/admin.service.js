const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

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
    prisma.user.count({ where: { role: 'USER' } }),
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
      where: { createdAt: { gte: sevenDaysAgo }, role: 'USER' },
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
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
  const where = {};

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
    }),
    prisma.user.count({ where }),
  ]);

  return { users: stripPasswordMany(users), total, page: Number(page), pages: Math.ceil(total / take) };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  return stripPassword(user);
};

// Only a SUPER_ADMIN may grant elevated (ADMIN/SUPER_ADMIN) roles — prevents a
// plain ADMIN from escalating a user (or themselves via a second account) to admin.
const resolveAssignableRole = (requestedRole, actorRole) => {
  const role = (requestedRole || 'USER').toUpperCase();
  if (role !== 'USER' && actorRole !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Only a super admin can assign admin roles');
  }
  return role;
};

const createUserByAdmin = async ({ name, email, password, phone, role }, actorRole) => {
  // Email mavjud bo'lsa, takrorlanishni tekshir
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan');
  }

  // Telefon mavjud bo'lsa, takrorlanishni tekshir
  if (phone) {
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) throw new ApiError(409, 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
  }

  if (!email && !phone) {
    throw new ApiError(400, 'Email yoki telefon raqam talab qilinadi');
  }

  if (!password) {
    throw new ApiError(400, 'Parol talab qilinadi');
  }

  const assignedRole = resolveAssignableRole(role, actorRole);

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

  return stripPassword(user);
};

const updateUserByAdmin = async (userId, data, actorRole) => {
  const { name, email, phone, role, password } = data;

  // A plain ADMIN may not edit a SUPER_ADMIN, nor assign elevated roles (privilege escalation guard)
  await assertCanActOn(userId, actorRole);

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = resolveAssignableRole(role, actorRole);
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

// A plain ADMIN may not act on a SUPER_ADMIN account — only another SUPER_ADMIN can.
const assertCanActOn = async (targetId, actorRole) => {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.role === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Only a super admin can perform this action on a super admin');
  }
};

const blockUser = async (userId, adminId, actorRole) => {
  if (userId === adminId) {
    throw new ApiError(400, 'You cannot block yourself');
  }
  await assertCanActOn(userId, actorRole);
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

const unblockUser = async (userId) => {
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

const deleteUser = async (userId, adminId, actorRole) => {
  if (userId === adminId) {
    throw new ApiError(400, 'You cannot delete yourself');
  }
  await assertCanActOn(userId, actorRole);
  try {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  } catch (err) {
    if (err.code === 'P2025') throw new ApiError(404, 'User not found');
    throw err;
  }
};

const getAllAdmins = async ({ page = 1, limit = 50 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
  const where = { role: { in: ['ADMIN', 'SUPER_ADMIN'] } };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.user.count({ where }),
  ]);

  return { users: stripPasswordMany(users), total, page: Number(page), pages: Math.ceil(total / take) };
};

const toggleAdminStatus = async (userId, adminId) => {
  if (userId === adminId) throw new ApiError(400, 'You cannot change your own status');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new ApiError(404, 'Admin not found');
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: !user.isBlocked },
  });
  return stripPassword(updated);
};

const getAllOrders = async ({ page = 1, limit = 20, status } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
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

const registerSuperAdmin = async ({ name, email, password, setupKey }) => {
  if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
    throw new ApiError(403, 'Invalid setup key');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: 'SUPER_ADMIN' },
  });
  return stripPassword(user);
};

const registerAdmin = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: 'ADMIN' },
  });
  return stripPassword(user);
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  blockUser,
  unblockUser,
  deleteUser,
  getAllAdmins,
  toggleAdminStatus,
  getAllOrders,
  registerSuperAdmin,
  registerAdmin,
};
