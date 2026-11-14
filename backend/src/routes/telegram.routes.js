const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegram.controller');

// Public — Telegram servers POST updates here (no auth). Path includes the bot
// token as a light shared-secret so random callers can't inject fake updates.
const crypto = require('crypto');
const same = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
router.post('/webhook/:token', (req, res, next) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !same(req.params.token, process.env.TELEGRAM_BOT_TOKEN)) {
    return res.status(403).json({ ok: false });
  }
  // Optional second factor: Telegram echoes the secret given to setWebhook in this header.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && !same(req.headers['x-telegram-bot-api-secret-token'], secret)) {
    return res.status(403).json({ ok: false });
  }
  next();
}, telegramController.webhook);

module.exports = router;
