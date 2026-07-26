const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.use(protect, authorize('ADMIN'));

router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);

router.put('/:key', settingsController.updateSetting);

module.exports = router;
