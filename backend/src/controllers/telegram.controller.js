const telegramService = require('../services/telegram.service');

// Telegram calls this (webhook). Always 200 quickly so Telegram doesn't retry.
const webhook = async (req, res) => {
  res.status(200).json({ ok: true });
  try {
    await telegramService.handleUpdate(req.body);
  } catch (_) {
    // handleUpdate already logs; never surface to Telegram
  }
};

module.exports = { webhook };
