const syncService = require('../services/sync.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const push = asyncHandler(async (req, res) => {
  const { operations } = req.body;
  if (!Array.isArray(operations) || operations.length === 0) {
    return res.status(200).json(new ApiResponse(200, { results: [] }, 'Nothing to sync'));
  }
  const results = await syncService.processSyncBatch(req.user.id, operations);
  res.status(200).json(new ApiResponse(200, { results }, 'Sync push completed'));
});

const pull = asyncHandler(async (req, res) => {
  const { lastSyncAt, shopId } = req.query;
  const data = await syncService.pullData(req.user.id, lastSyncAt, shopId);
  res.status(200).json(new ApiResponse(200, data, 'Sync pull completed'));
});

module.exports = { push, pull };
