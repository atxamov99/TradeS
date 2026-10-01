const saleService = require('../services/sale.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createSale = asyncHandler(async (req, res) => {
  const sale = await saleService.createSale(req.user.id, req.body);
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

const getShopSales = asyncHandler(async (req, res) => {
  const result = await saleService.getShopSales(req.params.id, req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Sales retrieved'));
});

module.exports = { createSale, bulkSync, getSales, getShopSales };
