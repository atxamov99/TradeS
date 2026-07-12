const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

// Canonical phone form for matching — digits only (drops +, spaces, dashes).
// The app sends "+998 94 033 50 44"; Telegram sends "998940335044" — both → "998940335044".
const normalizePhone = (p) => (p || '').replace(/\D/g, '');

const callTelegram = async (method, body) => {
  if (!API) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description || res.status}`);
  return data.result;
};

const sendMessage = (chatId, text, extra = {}) =>
  callTelegram('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });

// Register the webhook so Telegram pushes updates to our backend.
const setWebhook = (url) => callTelegram('setWebhook', { url, allowed_updates: ['message'] });

// ── Long-polling (local dev) ────────────────────────────────────────────────
// No public URL needed — the bot pulls updates itself. Used instead of a
// webhook while developing locally, where there's no stable ngrok URL to
// register. Production uses setWebhook() against the deployed Render URL.
let pollingOffset = 0;
let pollingActive = false;

const startPolling = async () => {
  if (pollingActive || !TOKEN) return;
  pollingActive = true;

  // A webhook and long-polling can't both be active — clear any stale webhook first.
  await callTelegram('deleteWebhook', {}).catch(() => {});
  logger.info('Telegram bot: long-polling started');

  (async function loop() {
    while (pollingActive) {
      try {
        // Short long-poll timeout — some local networks reset idle HTTPS
        // connections before Telegram's default 30s window completes.
        const updates = await callTelegram('getUpdates', { offset: pollingOffset, timeout: 8 });
        for (const update of updates) {
          pollingOffset = update.update_id + 1;
          await handleUpdate(update);
        }
      } catch (err) {
        logger.error(`Telegram polling error: ${err.message}${err.cause ? ` (${err.cause})` : ''}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  })();
};

const stopPolling = () => {
  pollingActive = false;
};

const WELCOME =
  'Assalomu alaykum! <b>TradeS</b> ga xush kelibsiz.\n\n' +
  'Ro\'yxatdan o\'tish / kirish uchun tasdiqlash kodini shu yerga yuboramiz.\n' +
  'Boshlash uchun pastdagi <b>«📱 Raqamni ulashish»</b> tugmasini bosing.';

const CONTACT_KEYBOARD = {
  keyboard: [[{ text: '📱 Raqamni ulashish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

// ── Contact Support via direct bot message ──────────────────────────────────
// Reached either via the app's "Contact Support" link
// (https://t.me/trades_uz_bot?start=support, which Telegram delivers as the
// text "/start support") or by a user messaging the bot on their own. Once a
// chat is "awaiting" a support message, its next free-text message is
// forwarded to ADMIN_SUPPORT_CHAT_IDS instead of the normal onboarding nudge.
// In-memory only (mirrors the module-level state already used for polling
// above) — acceptable since this is a short-lived UX flag, not durable data.
const awaitingSupportMessage = new Set();
const lastSupportMessageAt = new Map(); // chatId -> timestamp, per-chat cooldown
const SUPPORT_COOLDOWN_MS = 60 * 1000; // 1 forwarded message per minute per chat

const ADMIN_SUPPORT_CHAT_IDS = (process.env.ADMIN_SUPPORT_CHAT_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const escapeHtml = (str) =>
  String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry a flaky Telegram send a couple of times before giving up — transient
// network blips (seen on some Windows dev setups) shouldn't drop a support
// message when a simple retry would have gone through.
const SUPPORT_SEND_RETRIES = 2;
const SUPPORT_RETRY_DELAY_MS = 1500;

const sendWithRetry = async (chatId, text) => {
  let lastErr;
  for (let attempt = 0; attempt <= SUPPORT_SEND_RETRIES; attempt++) {
    try {
      return await sendMessage(chatId, text);
    } catch (err) {
      lastErr = err;
      if (attempt < SUPPORT_SEND_RETRIES) await sleep(SUPPORT_RETRY_DELAY_MS);
    }
  }
  throw lastErr;
};

// Send one message to every configured support admin. Best-effort per
// recipient — one admin's delivery failing shouldn't block the others.
// Shared by the bot's own direct-message flow and the app's Contact Support
// HTTP endpoint (support.service.js), so there's one place that knows about
// the (possibly multiple) admin chat ids.
const sendToSupportAdmins = (text) =>
  Promise.all(
    ADMIN_SUPPORT_CHAT_IDS.map((chatId) =>
      sendWithRetry(chatId, text).catch((err) =>
        logger.error(`Support forward to ${chatId} failed after ${SUPPORT_SEND_RETRIES + 1} attempts: ${err.message}`)
      )
    )
  );

const SUPPORT_PROMPT = 'Yordam kerakmi? Muammoingizni bitta xabar qilib yozing — jamoamiz ko\'rib chiqadi.';
const SUPPORT_SENT_ACK = '✅ Xabaringiz qabul qilindi. Tez orada javob beramiz.';
const SUPPORT_COOLDOWN_MSG = 'Iltimos, biroz kuting va keyin qayta yozing.';

/**
 * Handle one Telegram update (called from the webhook).
 * - /start  → welcome + "share contact" button
 * - contact → link phone ↔ chatId in PhoneAuth
 */
const handleUpdate = async (update) => {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;

  try {
    if (msg.contact) {
      const phone = normalizePhone(msg.contact.phone_number);
      if (!phone) return;
      await prisma.phoneAuth.upsert({
        where: { phone },
        create: { phone, telegramChatId: String(chatId) },
        update: { telegramChatId: String(chatId) },
      });
      await sendMessage(
        chatId,
        '✅ Raqamingiz ulandi! Endi ilovaga qayting va <b>«Kod olish»</b> tugmasini bosing — kod shu yerga keladi.',
        { reply_markup: { remove_keyboard: true } }
      );
      logger.info(`Telegram linked phone ${phone} -> chat ${chatId}`);
      return;
    }

    if (msg.text && msg.text.startsWith('/start support')) {
      awaitingSupportMessage.add(chatId);
      await sendMessage(chatId, SUPPORT_PROMPT);
      return;
    }

    if (msg.text && msg.text.startsWith('/start')) {
      await sendMessage(chatId, WELCOME, { reply_markup: CONTACT_KEYBOARD });
      return;
    }

    if (msg.text && awaitingSupportMessage.has(chatId)) {
      const lastAt = lastSupportMessageAt.get(chatId);
      if (lastAt && Date.now() - lastAt < SUPPORT_COOLDOWN_MS) {
        await sendMessage(chatId, SUPPORT_COOLDOWN_MSG);
        return;
      }
      awaitingSupportMessage.delete(chatId);
      lastSupportMessageAt.set(chatId, Date.now());

      if (ADMIN_SUPPORT_CHAT_IDS.length) {
        const from = msg.from || {};
        const who = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Noma\'lum';
        const username = from.username ? `@${from.username}` : '(username yo\'q)';
        const text =
          `🆘 <b>Yangi murojaat (Telegram bot)</b>\n\n` +
          `<b>Ism:</b> ${escapeHtml(who)}\n` +
          `<b>Username:</b> ${escapeHtml(username)}\n` +
          `<b>Chat ID:</b> ${chatId}\n\n` +
          `${escapeHtml(msg.text)}`;
        await sendToSupportAdmins(text);
      }
      await sendMessage(chatId, SUPPORT_SENT_ACK);
      return;
    }

    // Any other message — nudge to share contact
    await sendMessage(chatId, WELCOME, { reply_markup: CONTACT_KEYBOARD });
  } catch (err) {
    logger.error(`Telegram handleUpdate error: ${err.message}`);
  }
};

module.exports = { sendMessage, setWebhook, handleUpdate, normalizePhone, callTelegram, startPolling, stopPolling, sendToSupportAdmins };
