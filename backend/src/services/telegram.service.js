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

const WELCOME =
  'Assalomu alaykum! <b>TradeS</b> ga xush kelibsiz.\n\n' +
  'Ro\'yxatdan o\'tish / kirish uchun tasdiqlash kodini shu yerga yuboramiz.\n' +
  'Boshlash uchun pastdagi <b>«📱 Raqamni ulashish»</b> tugmasini bosing.';

const CONTACT_KEYBOARD = {
  keyboard: [[{ text: '📱 Raqamni ulashish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

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

    if (msg.text && msg.text.startsWith('/start')) {
      await sendMessage(chatId, WELCOME, { reply_markup: CONTACT_KEYBOARD });
      return;
    }

    // Any other message — nudge to share contact
    await sendMessage(chatId, WELCOME, { reply_markup: CONTACT_KEYBOARD });
  } catch (err) {
    logger.error(`Telegram handleUpdate error: ${err.message}`);
  }
};

module.exports = { sendMessage, setWebhook, handleUpdate, normalizePhone, callTelegram };
