const prisma = require('../config/prisma');
const { clampLimit } = require('../utils/pagination');

const getAuditLogs = async ({ page = 1, limit = 30, category, from, to, search } = {}) => {
  const take = clampLimit(limit, 30);
  const skip = (Number(page) - 1) * take;
  const where = {};

  if (category) where.category = category;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { actor: { contains: search, mode: 'insensitive' } },
      { target: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: Number(page), pages: Math.ceil(total / take) };
};

// Escape a value for safe CSV output (RFC 4180 + formula-injection prefix).
// Cells starting with = + - @ (or tab/CR) are prefixed with a single quote so
// spreadsheet apps won't interpret them as formulas.
const escapeCsv = (value) => {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
};

const MAX_EXPORT_ROWS = 10000;

const getAuditLogsExport = async ({ category, from, to } = {}) => {
  const where = {};
  if (category) where.category = category;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: MAX_EXPORT_ROWS,
  });

  const header = 'ID,Action,Category,Actor,Target,IP,CreatedAt\n';
  const rows = logs.map((l) =>
    [l.id, l.action, l.category, l.actor, l.target, l.ip, l.createdAt.toISOString()]
      .map(escapeCsv).join(',')
  ).join('\n');
  return header + rows;
};

const createAuditLog = async ({ action, category, actor, actorId, target, targetId, ip, metadata } = {}) => {
  return prisma.auditLog.create({
    data: { action, category, actor, actorId, target, targetId, ip, metadata },
  });
};

module.exports = { getAuditLogs, getAuditLogsExport, createAuditLog };
