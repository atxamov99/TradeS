const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.use(protect);

router.get('/summary', reportController.getSummary);
router.get('/daily', reportController.getDailyReport);
router.get('/monthly', reportController.getMonthlyReport);

// Admin-level reports
router.get('/overview', authorize('ADMIN', 'SUPER_ADMIN'), reportController.getAdminOverview);
router.get('/admin-activity', authorize('ADMIN', 'SUPER_ADMIN'), reportController.getAdminActivity);
router.get('/security', authorize('ADMIN', 'SUPER_ADMIN'), reportController.getSecurityReport);
router.get('/monthly-overview', authorize('ADMIN', 'SUPER_ADMIN'), reportController.getMonthlyOverview);
router.get('/export', authorize('ADMIN', 'SUPER_ADMIN'), reportController.exportReport);

module.exports = router;
