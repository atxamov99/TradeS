const express = require('express');
const Joi = require('joi');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const supportController = require('../controllers/support.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateOrderStatusSchema } = require('../validators/order.validator');

// All routes below require authentication + the single ADMIN role.
// There is exactly one admin account system-wide (owner decision) — bootstrapping
// or recovering it is a CLI-only operation (`node src/seedAdmin.js`), not an HTTP
// endpoint, so there is no "register admin" route here anymore.
router.use(protect, authorize('ADMIN'));

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Admin management
router.get('/admins', adminController.getAllAdmins);
router.patch('/admins/:id/status', adminController.toggleAdminStatus);

// Account role (user / director / cashier / admin) and the shops a cashier can be attached to
router.get('/shops', adminController.listBusinessShops);
router.patch(
  '/users/:id/account-kind',
  validate(Joi.object({ kind: Joi.string().valid('USER', 'DIRECTOR', 'CASHIER', 'ADMIN').required(), shopId: Joi.string().trim() })),
  adminController.setAccountKind
);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUserByAdmin);
router.patch('/users/:id', adminController.updateUserByAdmin);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/unblock', adminController.unblockUser);
router.delete('/users/:id', adminController.deleteUser);

// Support inbox (Contact Support form + Telegram bot /support tickets)
router.get('/support-messages', supportController.listSupportMessages);
router.post('/support-messages/:id/reply', supportController.replySupportMessage);
router.delete('/support-messages/:id', supportController.deleteSupportMessage);

// Order management
router.get('/orders', adminController.getAllOrders);
router.patch(
  '/orders/:id/status',
  validate(updateOrderStatusSchema),
  adminController.updateOrderStatus
);

module.exports = router;
