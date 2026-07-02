const adminService = require('../services/admin.service');
const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved'));
});

// ── Users ──────────────────────────────────────────────────────────────────

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Users retrieved'));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  res.status(200).json(new ApiResponse(200, { user }, 'User retrieved'));
});

const createUserByAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.createUserByAdmin(req.body, req.user.role);
  res.status(201).json(new ApiResponse(201, user, 'User created'));
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserByAdmin(req.params.id, req.body, req.user.role);
  res.status(200).json(new ApiResponse(200, user, 'User updated'));
});

const blockUser = asyncHandler(async (req, res) => {
  const user = await adminService.blockUser(req.params.id, req.user.id, req.user.role);
  res.status(200).json(new ApiResponse(200, { user }, 'User blocked'));
});

const unblockUser = asyncHandler(async (req, res) => {
  const user = await adminService.unblockUser(req.params.id);
  res.status(200).json(new ApiResponse(200, { user }, 'User unblocked'));
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id, req.user.id, req.user.role);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ── Admins ─────────────────────────────────────────────────────────────────

const getAllAdmins = asyncHandler(async (req, res) => {
  const result = await adminService.getAllAdmins(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Admins retrieved'));
});

const toggleAdminStatus = asyncHandler(async (req, res) => {
  const user = await adminService.toggleAdminStatus(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, { user }, 'Admin status updated'));
});

// ── Orders ─────────────────────────────────────────────────────────────────

const getAllOrders = asyncHandler(async (req, res) => {
  const result = await adminService.getAllOrders(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Orders retrieved'));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { order }, 'Order status updated'));
});

// ── Admin Registration ─────────────────────────────────────────────────────

const registerSuperAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.registerSuperAdmin(req.body);
  res.status(201).json(new ApiResponse(201, { user }, 'Super Admin registered successfully'));
});

const registerAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.registerAdmin(req.body);
  res.status(201).json(new ApiResponse(201, { user }, 'Admin registered successfully'));
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  blockUser,
  unblockUser,
  deleteUser,
  getAllAdmins,
  toggleAdminStatus,
  getAllOrders,
  updateOrderStatus,
  registerSuperAdmin,
  registerAdmin,
};
