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

const inviteMember = asyncHandler(async (req, res) => {
  const invite = await shopService.inviteMember(req.params.shopId, req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, { invite }, 'Invitation sent'));
});

const listShopInvites = asyncHandler(async (req, res) => {
  const invites = await shopService.listShopInvites(req.params.shopId, req.user.id);
  res.status(200).json(new ApiResponse(200, { invites }, 'Invitations retrieved'));
});

const cancelInvite = asyncHandler(async (req, res) => {
  const result = await shopService.cancelInvite(req.params.shopId, req.user.id, req.params.inviteId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const getMyInvites = asyncHandler(async (req, res) => {
  const invites = await shopService.getMyInvites(req.user.id);
  res.status(200).json(new ApiResponse(200, { invites }, 'Invitations retrieved'));
});

const acceptInvite = asyncHandler(async (req, res) => {
  const result = await shopService.respondToInvite(req.params.inviteId, req.user.id, true);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const declineInvite = asyncHandler(async (req, res) => {
  const result = await shopService.respondToInvite(req.params.inviteId, req.user.id, false);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const removeMember = asyncHandler(async (req, res) => {
  const result = await shopService.removeMember(req.params.shopId, req.user.id, req.params.userId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const requestBusinessUpgrade = asyncHandler(async (req, res) => {
  const data = await shopService.requestBusinessUpgrade(req.params.shopId, req.user.id);
  res.status(200).json(new ApiResponse(200, data, 'Confirmation code sent'));
});

const confirmBusinessUpgrade = asyncHandler(async (req, res) => {
  const shop = await shopService.confirmBusinessUpgrade(req.params.shopId, req.user.id, req.body, { ip: req.ip });
  res.status(200).json(new ApiResponse(200, { shop }, 'Upgraded to a business account'));
});

module.exports = { createShop, getMyShops, getShopMembers, inviteMember, listShopInvites, cancelInvite, getMyInvites, acceptInvite, declineInvite, removeMember, requestBusinessUpgrade, confirmBusinessUpgrade };
