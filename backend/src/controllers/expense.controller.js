const expenseService = require('../services/expense.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.params.shopId, req.user.id, req.body, { ip: req.ip });
  res.status(201).json(new ApiResponse(201, { expense }, 'Expense recorded'));
});

const listExpenses = asyncHandler(async (req, res) => {
  const data = await expenseService.listExpenses(req.params.shopId, req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Expenses retrieved'));
});

const deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(req.params.shopId, req.params.expenseId, req.user.id, { ip: req.ip });
  res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = { createExpense, listExpenses, deleteExpense };
