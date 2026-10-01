const reportService = require('../services/report.service');
const { assertShopOwnership } = require('../services/shop.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// Optional ?shopId= scoping: verify the caller owns it before trusting it as a
// filter (a forged shopId must never narrow/leak another seller's data).
const resolveOwnedShopId = async (req) => {
  if (!req.query.shopId) return undefined;
  const shop = await assertShopOwnership(req.query.shopId, req.user.id);
  return shop.id;
};

const getSummary = asyncHandler(async (req, res) => {
  const shopId = await resolveOwnedShopId(req);
  const data = await reportService.getSummary(req.user.id, shopId);
  res.status(200).json(new ApiResponse(200, data, 'Summary retrieved'));
});

const getDailyReport = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const shopId = await resolveOwnedShopId(req);
  const data = await reportService.getDailyReport(req.user.id, date, shopId);
  res.status(200).json(new ApiResponse(200, data, 'Daily report retrieved'));
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const shopId = await resolveOwnedShopId(req);
  const data = await reportService.getMonthlyReport(req.user.id, month, shopId);
  res.status(200).json(new ApiResponse(200, data, 'Monthly report retrieved'));
});

const getAdminOverview = asyncHandler(async (req, res) => {
  const data = await reportService.getAdminOverview(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Overview retrieved'));
});

const getAdminActivity = asyncHandler(async (req, res) => {
  const data = await reportService.getAdminActivity(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Admin activity retrieved'));
});

const getSecurityReport = asyncHandler(async (req, res) => {
  const data = await reportService.getSecurityReport(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Security report retrieved'));
});

const getMonthlyOverview = asyncHandler(async (req, res) => {
  const data = await reportService.getMonthlyOverview({ months: req.query.months });
  res.status(200).json(new ApiResponse(200, data, 'Monthly overview retrieved'));
});

const exportReport = asyncHandler(async (req, res) => {
  const csv = await reportService.exportReport(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
  res.status(200).send(csv);
});

module.exports = { getSummary, getDailyReport, getMonthlyReport, getAdminOverview, getAdminActivity, getSecurityReport, getMonthlyOverview, exportReport };
