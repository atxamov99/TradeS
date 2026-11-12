const logger = require('../utils/logger');

// Email delivery. Providers, in priority order:
//   1. Resend  — set RESEND_API_KEY (and optionally RESEND_FROM). Free tier; with the default
//                onboarding@resend.dev sender Resend only delivers to the account owner's own address
//                until a domain is verified.
//   2. SMTP    — set MAIL_SMTP_HOST / MAIL_SMTP_PORT / MAIL_SMTP_USER / MAIL_SMTP_PASS
//                (Gmail: smtp.gmail.com, 465, your address + a 16-char "App password").
//                Optional MAIL_FROM, e.g. "TradeS <you@gmail.com>".
//   3. Neither — DEV MODE: nothing is sent, the payload is logged and callers surface the code in
//                non-production responses so the whole flow stays testable.

const FROM_RESEND = process.env.RESEND_FROM || 'TradeS <onboarding@resend.dev>';
const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

const resendConfigured = () => !!process.env.RESEND_API_KEY;
const smtpConfigured = () => !!(process.env.MAIL_SMTP_HOST && process.env.MAIL_SMTP_USER && process.env.MAIL_SMTP_PASS);
const isConfigured = () => resendConfigured() || smtpConfigured();

let resendClient = null;
const getResend = () => {
  if (!resendConfigured()) return null;
  if (resendClient) return resendClient;
  try {
    // Lazy require so a missing package never crashes the app.
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
  } catch (err) {
    logger.warn(`Resend package not found (npm i resend): ${err.message}`);
    return null;
  }
};

let smtpTransport = null;
const getSmtp = () => {
  if (!smtpConfigured()) return null;
  if (smtpTransport) return smtpTransport;
  const nodemailer = require('nodemailer');
  const port = Number(process.env.MAIL_SMTP_PORT || 465);
  smtpTransport = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST,
    port,
    secure: process.env.MAIL_SMTP_SECURE ? process.env.MAIL_SMTP_SECURE !== 'false' : port === 465,
    auth: { user: process.env.MAIL_SMTP_USER, pass: process.env.MAIL_SMTP_PASS },
  });
  return smtpTransport;
};
const smtpFrom = () => process.env.MAIL_FROM || `TradeS <${process.env.MAIL_SMTP_USER}>`;

/** Returns { delivered, provider?, error?, dev? } — callers MUST check `delivered`. */
const sendEmail = async (to, subject, html, text) => {
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({ from: FROM_RESEND, to, subject, html, ...(text ? { text } : {}) });
      return { delivered: true, provider: 'resend' };
    } catch (err) {
      logger.error(`Resend failed (${to}): ${err.message}`);
      return { delivered: false, provider: 'resend', error: err.message };
    }
  }
  const smtp = getSmtp();
  if (smtp) {
    try {
      const info = await smtp.sendMail({ from: smtpFrom(), to, subject, html, ...(text ? { text } : {}) });
      // getTestMessageUrl is only truthy for Ethereal test inboxes (handy for verification).
      const preview = require('nodemailer').getTestMessageUrl(info) || undefined;
      return { delivered: true, provider: 'smtp', messageId: info.messageId, ...(preview ? { preview } : {}) };
    } catch (err) {
      logger.error(`SMTP failed (${to}): ${err.message}`);
      return { delivered: false, provider: 'smtp', error: err.message };
    }
  }
  logger.info(`[email dev] to=${to} | subject="${subject}" (no email provider configured - not sent)`);
  return { delivered: false, dev: true };
};

const sendCode = async (email, code) => {
  const subject = `TradeS: ${code} — tasdiqlash kodi / код подтверждения / verification code`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px">
      <h2 style="margin:0 0 4px;color:#16a34a">TradeS</h2>
      <p style="margin:0 0 12px;color:#475569">Tasdiqlash kodi · Код подтверждения · Verification code</p>
      <p style="font-size:34px;font-weight:800;letter-spacing:8px;margin:12px 0;color:#0f172a">${code}</p>
      <p style="color:#64748b;font-size:13px;line-height:1.5;margin:12px 0 0">
        Kod 5 daqiqa amal qiladi. Hech kimga bermang.<br>
        Код действует 5 минут. Никому не сообщайте.<br>
        The code is valid for 5 minutes. Don't share it with anyone.
      </p>
    </div>`;
  const text = `TradeS\n\nTasdiqlash kodi / Код подтверждения / Verification code: ${code}\n\nKod 5 daqiqa amal qiladi / Код действует 5 минут / Valid for 5 minutes.`;
  return sendEmail(email, subject, html, text);
};

const sendResetToken = async (email, token) => {
  const link = `${WEB_URL}/reset-password?token=${token}`;
  const subject = 'TradeS — parolni tiklash / сброс пароля / password reset';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px">
      <h2 style="margin:0 0 8px;color:#16a34a">TradeS</h2>
      <p>Parolni tiklash · Сброс пароля · Password reset:</p>
      <p><a href="${link}">${link}</a></p>
      <p style="color:#64748b;font-size:13px">30 daqiqa / 30 минут / 30 minutes. Agar bu siz bo'lmasangiz, e'tibor bermang / Если это не вы, проигнорируйте / If this wasn't you, ignore it.</p>
    </div>`;
  return sendEmail(email, subject, html);
};

module.exports = { sendCode, sendResetToken, sendEmail, isConfigured };
