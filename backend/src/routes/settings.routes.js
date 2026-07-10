const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.use(protect, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);

// Writing app-wide config (roles catalog, permission matrix) is a high-privilege
// action — restrict to SUPER_ADMIN.
router.put('/:key', authorize('SUPER_ADMIN'), settingsController.updateSetting);

module.exports = router;
