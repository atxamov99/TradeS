const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile retrieved'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddress(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, { addresses }, 'Address added'));
});

const updateAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.updateAddress(
    req.user.id,
    req.params.addressId,
    req.body
  );
  res.status(200).json(new ApiResponse(200, { addresses }, 'Address updated'));
});

const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.deleteAddress(req.user.id, req.params.addressId);
  res.status(200).json(new ApiResponse(200, { addresses }, 'Address deleted'));
});

const savePushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json(new ApiResponse(400, null, 'Token is required'));
  }
  await userService.savePushToken(req.user.id, token);
  res.status(200).json(new ApiResponse(200, null, 'Push token saved'));
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  savePushToken,
};
