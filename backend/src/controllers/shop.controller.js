const shopService = require('../services/shop.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createShop = asyncHandler(async (req, res) => {
  const shop = await shopService.createShop(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, { shop }, 'Shop created'));
});

const listMyShops = asyncHandler(async (req, res) => {
  const result = await shopService.listMyShops(req.user.id);
  res.status(200).json(new ApiResponse(200, result, 'Shops retrieved'));
});

const listShops = asyncHandler(async (req, res) => {
  const result = await shopService.listShops(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Shops retrieved'));
});

const getShopById = asyncHandler(async (req, res) => {
  const shop = await shopService.getShopById(req.params.id);
  res.status(200).json(new ApiResponse(200, { shop }, 'Shop retrieved'));
});

const updateShop = asyncHandler(async (req, res) => {
  const shop = await shopService.updateShop(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { shop }, 'Shop updated'));
});

module.exports = { createShop, listMyShops, listShops, getShopById, updateShop };
