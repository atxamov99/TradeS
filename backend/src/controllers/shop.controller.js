const shopService = require('../services/shop.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createShop = asyncHandler(async (req, res) => {
  const shop = await shopService.createShop(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, { shop }, 'Shop created'));
});

const getMyShops = asyncHandler(async (req, res) => {
  const shops = await shopService.getMyShops(req.user.id);
  res.status(200).json(new ApiResponse(200, { shops }, 'Shops retrieved'));
});

const getShopMembers = asyncHandler(async (req, res) => {
  const members = await shopService.getShopMembers(req.params.shopId, req.user.id);
  res.status(200).json(new ApiResponse(200, { members }, 'Members retrieved'));
});

const addMember = asyncHandler(async (req, res) => {
  const member = await shopService.addMember(req.params.shopId, req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, { member }, 'Member added'));
});

const removeMember = asyncHandler(async (req, res) => {
  const result = await shopService.removeMember(req.params.shopId, req.user.id, req.params.userId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = { createShop, getMyShops, getShopMembers, addMember, removeMember };
