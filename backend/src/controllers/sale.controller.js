const saleService = require('../services/sale.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createSale = asyncHandler(async (req, res) => {
  // The real-time endpoint is never an offline replay: ignore any client-supplied
  // isFromOffline, otherwise a cashier could set it to true and skip the stock check.
  const sale = await saleService.createSale(req.user.id, { ...req.body, isFromOffline: false });
  res.status(201).json(new ApiResponse(201, { sale }, 'Sale recorded'));
});

const bulkSync = asyncHandler(async (req, res) => {
  const results = await saleService.bulkSync(req.user.id, req.body.sales);
  res.status(200).json(new ApiResponse(200, { results }, 'Bulk sync completed'));
});

const getSales = asyncHandler(async (req, res) => {
  const result = await saleService.getSales(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Sales retrieved'));
});

module.exports = { createSale, bulkSync, getSales };
