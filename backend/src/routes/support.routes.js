const express = require('express');
const router = express.Router();

const supportController = require('../controllers/support.controller');
const { supportLimiter } = require('../middlewares/rateLimiter.middleware');

// Deliberately public (no `protect`) — a locked-out user with no working
// login must still be able to reach support.
router.post('/', supportLimiter, supportController.sendSupportMessage);

module.exports = router;
