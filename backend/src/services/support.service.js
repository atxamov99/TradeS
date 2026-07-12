const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const telegramService = require('./telegram.service');

const sendSupportMessage = async ({ name, contact, message }, userId) => {
  if (!name?.trim() || !contact?.trim() || !message?.trim()) {
    throw new ApiError(400, 'Name, contact, and message are required');
  }
  if (message.length > 2000) {
    throw new ApiError(400, 'Message is too long (max 2000 characters)');
  }

  const record = await prisma.supportMessage.create({
    data: { userId: userId || null, name: name.trim(), contact: contact.trim(), message: message.trim() },
  });

  const text =
    `🆘 <b>Yangi murojaat (Contact Support)</b>\n\n` +
    `<b>Ism:</b> ${escapeHtml(record.name)}\n` +
    `<b>Aloqa:</b> ${escapeHtml(record.contact)}\n` +
    (userId ? `<b>User ID:</b> ${userId}\n` : '') +
    `\n${escapeHtml(record.message)}`;
  // sendToSupportAdmins is already best-effort per recipient — don't fail the
  // user-facing request if Telegram delivery hiccups; the message is still
  // saved and can be checked manually.
  await telegramService.sendToSupportAdmins(text);

  return { message: 'Support message sent' };
};

// Minimal HTML-escaping since messages are sent with parse_mode: 'HTML' and
// user-supplied text could otherwise break formatting or inject tags.
const escapeHtml = (str) =>
  String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

module.exports = { sendSupportMessage };
