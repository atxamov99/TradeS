const express = require('express');
const router = express.Router();

const auditController = require('../controllers/audit.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.use(protect, authorize('ADMIN'));

router.get('/', auditController.getAuditLogs);
router.get('/export', auditController.getAuditLogsExport);

module.exports = router;
