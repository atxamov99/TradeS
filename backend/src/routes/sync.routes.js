const express = require('express');
const router = express.Router();

const syncController = require('../controllers/sync.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { syncPushSchema } = require('../validators/sync.validator');

router.use(protect);

router.post('/push', validate(syncPushSchema), syncController.push);   // Mobile → Server
router.get('/pull', syncController.pull);    // Server → Mobile

module.exports = router;
