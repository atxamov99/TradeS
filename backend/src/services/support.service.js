const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const telegramService = require('./telegram.service');

// Minimal HTML-escaping since messages are sent with parse_mode: 'HTML' and
// user-supplied text could otherwise break formatting or inject tags.
const escapeHtml = (str) =>
  String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

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

// ── Admin inbox ──────────────────────────────────────────────────────────────

const listSupportMessages = async ({ status, page = 1, limit = 20 } = {}) => {
  const where = status ? { status } : {};
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.supportMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.supportMessage.count({ where }),
  ]);

  return { items, total, page: Number(page) || 1, limit: take };
};

const replySupportMessage = async (id, replyText, adminId) => {
  if (!replyText?.trim()) throw new ApiError(400, 'Reply text is required');

  const ticket = await prisma.supportMessage.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, 'Support message not found');

  // Only a "bot" ticket has somewhere to deliver the reply to — a "web" one
  // was submitted anonymously/via app and has no return channel here.
  if (ticket.source === 'bot' && ticket.telegramChatId) {
    await telegramService.sendMessage(
      ticket.telegramChatId,
      `💬 <b>Jamoadan javob:</b>\n\n${escapeHtml(replyText.trim())}`
    );
  }

  return prisma.supportMessage.update({
    where: { id },
    data: { adminReply: replyText.trim(), status: 'answered', repliedAt: new Date(), repliedBy: adminId },
  });
};

const deleteSupportMessage = async (id) => {
  const ticket = await prisma.supportMessage.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, 'Support message not found');
  await prisma.supportMessage.delete({ where: { id } });
};

module.exports = { sendSupportMessage, listSupportMessages, replySupportMessage, deleteSupportMessage };
