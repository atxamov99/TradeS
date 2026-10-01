const prisma = require('../config/prisma');

/**
 * Build a date range for a given day
 */
const dayRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Build a date range for a given month (YYYY-MM)
 */
const monthRange = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const aggregateSales = async (userId, startDate, endDate, shopId) => {
  const stats = await prisma.sale.aggregate({
    where: {
      userId,
      ...(shopId ? { shopId } : {}),
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: {
      totalRevenue: true,
      totalCost: true,
      profit: true,
    },
    _count: {
      _all: true,
    },
    _avg: {
      profit: true,
    },
  });

  return {
    totalRevenue: stats._sum.totalRevenue || 0,
    totalCost: stats._sum.totalCost || 0,
    totalProfit: stats._sum.profit || 0,
    salesCount: stats._count._all || 0,
    avgProfit: stats._avg.profit || 0,
  };
};

const topProducts = async (userId, startDate, endDate, limit = 5, shopId) => {
  const result = await prisma.sale.groupBy({
    by: ['productName'],
    where: {
      userId,
      ...(shopId ? { shopId } : {}),
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: {
      profit: true,
      totalRevenue: true,
      quantity: true,
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _sum: {
        profit: 'desc',
      },
    },
    take: limit,
  });

  return result.map(r => ({
    _id: r.productName,
    totalProfit: r._sum.profit,
    totalRevenue: r._sum.totalRevenue,
    salesCount: r._count._all,
    totalQty: r._sum.quantity,
  }));
};

const getDailyReport = async (userId, dateStr, shopId) => {
  const { start, end } = dayRange(dateStr || new Date().toISOString().slice(0, 10));
  const [stats, products, salesRaw] = await Promise.all([
    aggregateSales(userId, start, end, shopId),
    topProducts(userId, start, end, 5, shopId),
    prisma.sale.findMany({
      where: { userId, ...(shopId ? { shopId } : {}), createdAt: { gte: start, lte: end } },
      select: { createdAt: true, totalRevenue: true, profit: true },
    }),
  ]);

  // Hourly breakdown manually from salesRaw
  const hourlyMap = {};
  salesRaw.forEach(s => {
    const hour = s.createdAt.getHours();
    if (!hourlyMap[hour]) hourlyMap[hour] = { revenue: 0, profit: 0, count: 0 };
    hourlyMap[hour].revenue += s.totalRevenue;
    hourlyMap[hour].profit += s.profit;
    hourlyMap[hour].count++;
  });

  const hourlySales = Object.keys(hourlyMap).map(hour => ({
    _id: parseInt(hour),
    ...hourlyMap[hour],
  })).sort((a, b) => a._id - b._id);

  return { date: dateStr, stats, topProducts: products, hourlySales };
};

const getMonthlyReport = async (userId, yearMonth, shopId) => {
  const ym = yearMonth || new Date().toISOString().slice(0, 7);
  const { start, end } = monthRange(ym);

  const [stats, products, salesRaw] = await Promise.all([
    aggregateSales(userId, start, end, shopId),
    topProducts(userId, start, end, 10, shopId),
    prisma.sale.findMany({
      where: { userId, ...(shopId ? { shopId } : {}), createdAt: { gte: start, lte: end } },
      select: { createdAt: true, totalRevenue: true, profit: true },
    }),
  ]);

  // Daily breakdown manually from salesRaw
  const dailyMap = {};
  salesRaw.forEach(s => {
    const date = s.createdAt.toISOString().slice(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { revenue: 0, profit: 0, count: 0 };
    dailyMap[date].revenue += s.totalRevenue;
    dailyMap[date].profit += s.profit;
    dailyMap[date].count++;
  });

  const dailySales = Object.keys(dailyMap).map(date => ({
    _id: date,
    ...dailyMap[date],
  })).sort((a, b) => a._id.localeCompare(b._id));

  return { month: ym, stats, topProducts: products, dailySales };
};

const getSummary = async (userId, shopId) => {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [todayStats, monthStats, allTimeStats, lowStock] = await Promise.all([
    aggregateSales(userId, ...Object.values(dayRange(today)), shopId),
    aggregateSales(userId, ...Object.values(monthRange(thisMonth)), shopId),
    aggregateSales(userId, new Date(0), new Date(), shopId),
    prisma.product.findMany({
      where: { shop: { ownerId: userId }, ...(shopId ? { shopId } : {}), stock: { lte: 5 } },
      select: { id: true, name: true, stock: true, unit: true },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
  ]);

  return { today: todayStats, thisMonth: monthStats, allTime: allTimeStats, lowStock };
};

// ── Admin-level Reports (cross-user) ────────────────────────────────────────

const getAdminOverview = async ({ from, to } = {}) => {
  const now = new Date();
  const rangeStart = from ? new Date(from) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rangeEnd = to ? new Date(to) : now;
  rangeEnd.setHours(23, 59, 59, 999);
  rangeStart.setHours(0, 0, 0, 0);

  const dailyActiveUsers = await prisma.user.count({
    where: { lastLogin: { gte: rangeStart, lte: rangeEnd }, deletedAt: null },
  });

  const weeklyRegistrations = await prisma.user.count({
    where: { createdAt: { gte: rangeStart, lte: rangeEnd }, role: 'USER', deletedAt: null },
  });

  const failedLogins = await prisma.auditLog.count({
    where: { action: 'LOGIN_FAILED', createdAt: { gte: rangeStart, lte: rangeEnd } },
  });

  const totalUsers = await prisma.user.count({ where: { role: 'USER', deletedAt: null } });
  const totalProducts = await prisma.product.count({ where: { isActive: true } });
  const totalOrders = await prisma.order.count();

  const revenueResult = await prisma.order.aggregate({
    where: { createdAt: { gte: rangeStart, lte: rangeEnd }, paymentStatus: 'paid' },
    _sum: { totalPrice: true },
  });

  const totalRevenue = revenueResult._sum.totalPrice || 0;

  return {
    dailyActiveUsers,
    weeklyRegistrations,
    failedLogins,
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
  };
};

const getAdminActivity = async ({ from, to } = {}) => {
  const rangeStart = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rangeEnd = to ? new Date(to) : new Date();
  rangeEnd.setHours(23, 59, 59, 999);
  rangeStart.setHours(0, 0, 0, 0);

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, deletedAt: null },
    select: { id: true, name: true, email: true, lastLogin: true, createdAt: true, isBlocked: true },
  });

  const logs = admins.map((a) => ({
    adminId: a.id,
    name: a.name,
    email: a.email,
    status: a.isBlocked ? 'suspended' : 'active',
    lastActive: a.lastLogin ? a.lastLogin.toISOString() : null,
    registeredAt: a.createdAt.toISOString(),
  }));

  return {
    totalAdmins: admins.length,
    activeAdmins: admins.filter((a) => !a.isBlocked).length,
    logs,
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
  };
};

const getSecurityReport = async ({ from, to } = {}) => {
  const rangeStart = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rangeEnd = to ? new Date(to) : new Date();
  rangeEnd.setHours(23, 59, 59, 999);
  rangeStart.setHours(0, 0, 0, 0);

  const blockedUsers = await prisma.user.count({
    where: { isBlocked: true, updatedAt: { gte: rangeStart, lte: rangeEnd }, deletedAt: null },
  });

  const totalAccounts = await prisma.user.count({ where: { deletedAt: null } });
  const blockedAccounts = await prisma.user.count({ where: { isBlocked: true, deletedAt: null } });

  const failedAttempts = await prisma.auditLog.count({
    where: { action: 'LOGIN_FAILED', createdAt: { gte: rangeStart, lte: rangeEnd } },
  });

  return {
    blockedUsers,
    totalAccounts,
    blockedAccounts,
    failedAttempts,
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
  };
};

const getMonthlyOverview = async ({ months } = {}) => {
  const count = Math.min(Math.max(Number(months) || 6, 1), 12);
  const now = new Date();
  const monthKeys = Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const trend = await Promise.all(monthKeys.map(async (ym) => {
    const { start, end } = monthRange(ym);
    const [newUsers, supportTotal, supportOpen, supportAnswered] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: start, lte: end }, role: 'USER', deletedAt: null } }),
      prisma.supportMessage.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.supportMessage.count({ where: { createdAt: { gte: start, lte: end }, status: 'open' } }),
      prisma.supportMessage.count({ where: { createdAt: { gte: start, lte: end }, status: 'answered' } }),
    ]);
    return { month: ym, newUsers, supportTotal, supportOpen, supportAnswered };
  }));

  return { months: trend, current: trend[trend.length - 1] };
};

// Escape a value for safe CSV output. Prevents CSV/formula injection: a cell that
// starts with = + - @ (or tab/CR) can be executed as a formula when opened in Excel/
// Sheets, so we prefix such values with a single quote. Also quotes values containing
// commas, quotes, or newlines per RFC 4180.
const escapeCsv = (value) => {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const exportReport = async ({ type, from, to } = {}) => {
  const rangeStart = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rangeEnd = to ? new Date(to) : new Date();
  rangeEnd.setHours(23, 59, 59, 999);
  rangeStart.setHours(0, 0, 0, 0);

  if (type === 'users') {
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const header = 'ID,Name,Email,Role,Status,CreatedAt\n';
    const rows = users.map((u) =>
      [u.id, u.name, u.email, u.role, u.isBlocked ? 'blocked' : 'active', u.createdAt.toISOString()]
        .map(escapeCsv).join(',')
    ).join('\n');
    return header + rows;
  }

  if (type === 'orders') {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const header = 'ID,OrderNumber,User,Total,Status,CreatedAt\n';
    const rows = orders.map((o) =>
      [o.id, o.orderNumber, o.user.name, o.totalPrice, o.orderStatus, o.createdAt.toISOString()]
        .map(escapeCsv).join(',')
    ).join('\n');
    return header + rows;
  }

  return '';
};

module.exports = { getDailyReport, getMonthlyReport, getSummary, getAdminOverview, getAdminActivity, getSecurityReport, getMonthlyOverview, exportReport };
