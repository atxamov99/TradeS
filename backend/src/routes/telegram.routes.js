const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegram.controller');

// Public — Telegram servers POST updates here (no auth). Path includes the bot
// token as a light shared-secret so random callers can't inject fake updates.
router.post('/webhook/:token', (req, res, next) => {
  if (req.params.token !== process.env.TELEGRAM_BOT_TOKEN) {
    return res.status(403).json({ ok: false });
  }
  next();
}, telegramController.webhook);

module.exports = router;
