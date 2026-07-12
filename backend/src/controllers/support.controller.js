const supportService = require('../services/support.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const sendSupportMessage = asyncHandler(async (req, res) => {
  const result = await supportService.sendSupportMessage(req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = { sendSupportMessage };
