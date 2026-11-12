const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { assertShopOwner } = require('../utils/shopAccess');
const { createAuditLog } = require('./audit.service');

// Expenses are financial data: only a shop OWNER may record, read or delete
// them (a CASHIER never sees the shop's costs — same rule as revenue/profit).
const requireOwner = async (shopId, userId) => {
  if (!(await assertShopOwner(shopId, userId))) {
    throw new ApiError(403, 'Only the shop owner can manage expenses', [], '', 'OWNER_ONLY');
  }
};

const createExpense = async (shopId, userId, { amount, category = 'other', note = '' }, meta = {}) => {
  await requireOwner(shopId, userId);
  const expense = await prisma.expense.create({
    data: { shopId, amount: Number(amount), category, note, createdById: userId },
  });
  await createAuditLog({
    action: 'EXPENSE_CREATE', category: 'inventory', actor: userId, actorId: userId,
    target: `expense:${expense.id}`, targetId: expense.id, ip: meta.ip || '',
    metadata: { shopId, amount: expense.amount, category: expense.category },
  }).catch(() => {});
  return expense;
};

const listExpenses = async (shopId, userId, { from, to } = {}) => {
  await requireOwner(shopId, userId);
  const createdAt = {};
  if (from) createdAt.gte = new Date(from);
  if (to) createdAt.lte = new Date(to);
  const where = { shopId, ...(Object.keys(createdAt).length ? { createdAt } : {}) };
  const [expenses, agg] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);
  return { expenses, total: agg._sum.amount || 0 };
};

const deleteExpense = async (shopId, expenseId, userId, meta = {}) => {
  await requireOwner(shopId, userId);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, shopId } });
  if (!expense) throw new ApiError(404, 'Expense not found');
  await prisma.expense.delete({ where: { id: expenseId } });
  await createAuditLog({
    action: 'EXPENSE_DELETE', category: 'inventory', actor: userId, actorId: userId,
    target: `expense:${expenseId}`, targetId: expenseId, ip: meta.ip || '',
    metadata: { shopId, amount: expense.amount, category: expense.category },
  }).catch(() => {});
  return { message: 'Expense deleted' };
};

module.exports = { createExpense, listExpenses, deleteExpense };
