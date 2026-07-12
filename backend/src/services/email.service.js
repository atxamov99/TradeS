const logger = require('../utils/logger');

// Email delivery via Resend. The API key is provided at runtime (RESEND_API_KEY).
// Until it's set we run in DEV MODE: nothing is actually sent, the payload is logged,
// and callers surface the code in non-production responses so the whole flow stays
// testable end-to-end without a provider. This mirrors telegram.service's role for
// the phone channel.

const FROM = process.env.RESEND_FROM || 'TradeS <onboarding@resend.dev>';
const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

const isConfigured = () => !!process.env.RESEND_API_KEY;

let resendClient = null;
const getClient = () => {
  if (!isConfigured()) return null;
  if (resendClient) return resendClient;
  try {
    // Lazy require so a missing package never crashes the app in dev mode.
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
  } catch (err) {
    logger.warn(`Resend paketi topilmadi (npm i resend) — email dev rejimda ishlaydi: ${err.message}`);
    return null;
  }
};

const sendEmail = async (to, subject, html) => {
  const client = getClient();
  if (!client) {
    logger.info(`[email dev] to=${to} | subject="${subject}" (RESEND_API_KEY yo'q — yuborilmadi)`);
    return { delivered: false, dev: true };
  }
  try {
    await client.emails.send({ from: FROM, to, subject, html });
    return { delivered: true };
  } catch (err) {
    logger.error(`Email yuborishda xato (${to}): ${err.message}`);
    return { delivered: false, error: err.message };
  }
};

const sendCode = async (email, code) => {
  const subject = 'TradeS tasdiqlash kodi';
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:auto">
      <h2 style="margin:0 0 8px">TradeS</h2>
      <p>Tasdiqlash kodingiz:</p>
      <p style="font-size:30px;font-weight:800;letter-spacing:6px;margin:12px 0">${code}</p>
      <p style="color:#666">Kod 5 daqiqa amal qiladi. Hech kimga bermang.</p>
    </div>`;
  return sendEmail(email, subject, html);
};

const sendResetToken = async (email, token) => {
  const link = `${WEB_URL}/reset-password?token=${token}`;
  const subject = 'TradeS — parolni tiklash';
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:auto">
      <h2 style="margin:0 0 8px">TradeS</h2>
      <p>Parolni tiklash uchun quyidagi havolaga o'ting:</p>
      <p><a href="${link}">${link}</a></p>
      <p style="color:#666">Havola 30 daqiqa amal qiladi. Agar bu siz bo'lmasangiz, e'tibor bermang.</p>
    </div>`;
  return sendEmail(email, subject, html);
};

module.exports = { sendCode, sendResetToken, sendEmail, isConfigured };
