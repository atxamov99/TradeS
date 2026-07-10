const settingsService = require('../services/settings.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllSettings();
  res.status(200).json(new ApiResponse(200, { settings }, 'Settings retrieved'));
});

const getSetting = asyncHandler(async (req, res) => {
  const result = await settingsService.getSetting(req.params.key);
  res.status(200).json(new ApiResponse(200, result, 'Setting retrieved'));
});

const updateSetting = asyncHandler(async (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(req.body, 'value')) {
    throw new ApiError(400, 'value talab qilinadi');
  }
  const result = await settingsService.upsertSetting(req.params.key, req.body.value);
  res.status(200).json(new ApiResponse(200, result, 'Setting saved'));
});

module.exports = { getAllSettings, getSetting, updateSetting };
