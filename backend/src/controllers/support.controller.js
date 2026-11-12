const supportService = require('../services/support.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const sendSupportMessage = asyncHandler(async (req, res) => {
  const result = await supportService.sendSupportMessage(req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const listSupportMessages = asyncHandler(async (req, res) => {
  const result = await supportService.listSupportMessages(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Support messages retrieved'));
});

const replySupportMessage = asyncHandler(async (req, res) => {
  const ticket = await supportService.replySupportMessage(req.params.id, req.body.reply, req.user.id);
  res.status(200).json(new ApiResponse(200, { ticket }, 'Reply sent'));
});

const deleteSupportMessage = asyncHandler(async (req, res) => {
  await supportService.deleteSupportMessage(req.params.id);
  res.status(200).json(new ApiResponse(200, {}, 'Support message deleted'));
});

module.exports = { sendSupportMessage, listSupportMessages, replySupportMessage, deleteSupportMessage };
