const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('./audit.service');
const telegramService = require('./telegram.service');
const emailService = require('./email.service');

const OTP_EXPIRES_MIN = 5;
const OTP_MAX_ATTEMPTS = 5;

const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Issue an access+refresh token pair for a user and persist the refresh token.
const issueTokens = async (user, meta = {}) => {
  const tokenPayload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
      userAgent: meta.userAgent || '',
      ip: meta.ip || '',
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

/**
 * Register a new user
 */
const register = async ({ name, email, phone, password }) => {
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, 'Email already registered');
  }
  if (phone) {
    const existing = await prisma.user.findFirst({ where: { phone } });
    if (existing) throw new ApiError(409, 'Phone already registered');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashedPassword },
  });

  const userResponse = { ...user };
  delete userResponse.password;
  return userResponse;
};

/**
 * Login user and return tokens
 */
const login = async ({ email, phone, password }, meta = {}) => {
  const logger = require('../utils/logger');
  logger.debug(`Login attempt for ${email || phone}`);
  
  let user;
  if (email) {
    user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  } else if (phone) {
    user = await prisma.user.findFirst({ where: { phone, deletedAt: null } });
  }

  if (!user) {
    logger.warn(`Login failed: User not found for ${email || phone}`);
    await createAuditLog({
      action: 'LOGIN_FAILED',
      category: 'auth',
      actor: email || phone || 'unknown',
      ip: meta.ip || '',
    }).catch(() => {});
    throw new ApiError(401, 'Invalid credentials');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    logger.warn(`Login failed: Incorrect password for ${email || phone}`);
    await createAuditLog({
      action: 'LOGIN_FAILED',
      category: 'auth',
      actor: email || phone,
      ip: meta.ip || '',
    }).catch(() => {});
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.isBlocked) {
    logger.warn(`Login failed: Account blocked for ${email || phone}`);
    throw new ApiError(403, 'Your account has been blocked');
  }

  logger.info(`Login successful for ${email || phone} (${user.role})`);
  const tokenPayload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
      userAgent: meta.userAgent || '',
      ip: meta.ip || '',
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const userResponse = { ...user };
  delete userResponse.password;

  return { user: userResponse, accessToken, refreshToken: refreshTokenValue };
};

/**
 * Rotate refresh token
 */
const refreshTokens = async (incomingRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: incomingRefreshToken,
      isRevoked: false,
    },
  });

  if (!storedToken) {
    throw new ApiError(401, 'Refresh token not found or already revoked');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.isBlocked) {
    throw new ApiError(401, 'User not found or blocked');
  }

  const tokenPayload = { id: user.id, role: user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  // Rotate atomically: revoke the old token and mint the new one in a single
  // transaction. The updateMany guard (isRevoked:false) ensures only one concurrent
  // request can win the rotation — a second, racing request sees count 0 and is
  // rejected, preventing a single refresh token from yielding two live sessions.
  await prisma.$transaction(async (tx) => {
    const revoked = await tx.refreshToken.updateMany({
      where: { id: storedToken.id, isRevoked: false },
      data: { isRevoked: true },
    });
    if (revoked.count === 0) {
      throw new ApiError(401, 'Refresh token already used');
    }
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt,
        userAgent: storedToken.userAgent,
        ip: storedToken.ip,
      },
    });
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — revoke specific refresh token
 */
const logout = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  } catch (err) {
    // If token doesn't exist, ignore
  }
};

/**
 * Logout all sessions for a user
 */
const logoutAll = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
};

/**
 * Google OAuth — verify the ID token (credential), find-or-create the user, issue tokens
 */
const googleAuth = async (credential, meta = {}) => {
  if (!credential) throw new ApiError(400, 'Google credential is required');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google token yaroqsiz');
  }

  const { email, name, picture } = payload;
  if (!email) throw new ApiError(400, 'Google akkauntida email yo\'q');

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Google-only account — password column is required, so store an unusable
    // random hash (they sign in with Google; can set a password via reset later).
    const randomHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
    user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        password: randomHash,
        avatar: picture || null,
        isEmailVerified: true,
      },
    });
  } else {
    const updates = {};
    if (!user.isEmailVerified) updates.isEmailVerified = true;
    if (!user.avatar && picture) updates.avatar = picture;
    if (Object.keys(updates).length) {
      user = await prisma.user.update({ where: { id: user.id }, data: updates });
    }
  }

  if (user.isBlocked) throw new ApiError(403, 'Hisobingiz bloklangan');

  const { accessToken, refreshToken } = await issueTokens(user, meta);
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const userResponse = { ...user };
  delete userResponse.password;
  return { user: userResponse, accessToken, refreshToken };
};

/**
 * Request an OTP code — delivered to the user's Telegram (linked when they shared
 * their contact with the bot). Free SMS-code alternative.
 */
const requestOtp = async (rawPhone) => {
  const phone = telegramService.normalizePhone(rawPhone);
  if (!phone) throw new ApiError(400, 'Telefon raqam noto\'g\'ri');

  // requestOtp is only used by the registration flow — reject already-registered
  // phones before sending a code, so we don't waste a Telegram message on someone
  // who will be rejected at the verify step anyway. (verifyOtp keeps its own 409
  // guard as defense in depth.)
  const canonicalPhone = `+${phone}`;
  const existingUser = await prisma.user.findFirst({ where: { phone: canonicalPhone, deletedAt: null } });
  if (existingUser) {
    throw new ApiError(409, 'Bu raqam allaqachon ro\'yxatdan o\'tgan. Kirish sahifasi orqali kiring.');
  }

  const record = await prisma.phoneAuth.findUnique({ where: { phone } });
  if (!record || !record.telegramChatId) {
    // The bot has no chat for this phone yet — user must connect Telegram first.
    throw new ApiError(428, 'Avval Telegram bot orqali raqamingizni ulang');
  }

  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

  await prisma.phoneAuth.update({
    where: { phone },
    data: { otpCode: code, otpExpiresAt, attempts: 0 },
  });

  await telegramService.sendMessage(
    record.telegramChatId,
    `🔐 <b>TradeS</b> tasdiqlash kodi:\n\n<code>${code}</code>\n\nKod ${OTP_EXPIRES_MIN} daqiqa amal qiladi. Hech kimga bermang.`
  );

  return { message: 'Kod Telegram orqali yuborildi' };
};

/**
 * Verify the OTP and register-or-login the user by phone.
 * New users provide name + password; returning users just get logged in.
 */
const verifyOtp = async ({ phone: rawPhone, code, name, password }, meta = {}) => {
  const phone = telegramService.normalizePhone(rawPhone);
  if (!phone || !code) throw new ApiError(400, 'Telefon va kod talab qilinadi');

  const record = await prisma.phoneAuth.findUnique({ where: { phone } });
  if (!record || !record.otpCode || !record.otpExpiresAt) {
    throw new ApiError(400, 'Avval kod so\'rang');
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, 'Juda ko\'p urinish. Yangi kod so\'rang');
  }
  if (record.otpExpiresAt < new Date()) {
    throw new ApiError(400, 'Kod muddati tugagan. Yangi kod so\'rang');
  }
  if (record.otpCode !== String(code).trim()) {
    await prisma.phoneAuth.update({ where: { phone }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, 'Kod noto\'g\'ri');
  }

  // OTP correct — clear it (single use)
  await prisma.phoneAuth.update({
    where: { phone },
    data: { otpCode: null, otpExpiresAt: null, attempts: 0 },
  });

  // Find or create the user by phone. Store the phone in +<digits> canonical form.
  // Soft-deleted accounts are ignored so the same number can register afresh.
  const canonicalPhone = `+${phone}`;
  let user = await prisma.user.findFirst({ where: { phone: canonicalPhone, deletedAt: null } });

  if (!user) {
    if (!password) throw new ApiError(400, 'Ro\'yxatdan o\'tish uchun parol talab qilinadi');
    const hashed = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        name: name || 'Foydalanuvchi',
        phone: canonicalPhone,
        password: hashed,
        isEmailVerified: false,
      },
    });
  } else if (password) {
    // The account already exists, yet the caller supplied a password — this is a
    // registration attempt for an already-registered phone. Refuse instead of
    // silently logging into the existing account and discarding the new name/password.
    throw new ApiError(409, 'Bu raqam allaqachon ro\'yxatdan o\'tgan. Kirish sahifasi orqali kiring.');
  }

  if (user.isBlocked) throw new ApiError(403, 'Hisobingiz bloklangan');

  const { accessToken, refreshToken } = await issueTokens(user, meta);
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const userResponse = { ...user };
  delete userResponse.password;
  return { user: userResponse, accessToken, refreshToken };
};

const PASSWORD_RESET_EXPIRES_MIN = 30;

const hashResetToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

/**
 * Request a password reset. Generates a random token, stores its hash + expiry on
 * the user, and returns the raw token in a dev-safe way (no real email/SMS is
 * configured). Always returns the same generic message to avoid user enumeration.
 */
const forgotPassword = async (email) => {
  const genericMessage = 'Agar email mavjud bo\'lsa, tiklash tokeni yuborildi';
  if (!email) return { message: genericMessage };

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) return { message: genericMessage };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MIN * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: hashResetToken(rawToken), passwordResetExpires: expiresAt },
  });

  // Send the reset link by email (real via Resend when configured; otherwise a
  // dev no-op that logs). Also log the token and, when email isn't configured in
  // non-production, return it so the flow stays testable end-to-end.
  const logger = require('../utils/logger');
  logger.info(`Password reset token for ${email}: ${rawToken} (valid ${PASSWORD_RESET_EXPIRES_MIN}m)`);
  await emailService.sendResetToken(email, rawToken);

  const result = { message: genericMessage };
  if (!emailService.isConfigured() && process.env.NODE_ENV !== 'production') {
    result.resetToken = rawToken;
    result.expiresAt = expiresAt;
  }
  return result;
};

/**
 * Reset a password using a valid, unexpired token. Verifies the token hash,
 * updates the password, clears the token, and revokes all refresh sessions.
 */
const resetPassword = async (rawToken, newPassword) => {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashResetToken(rawToken),
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) throw new ApiError(400, 'Token yaroqsiz yoki muddati tugagan');

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
    }),
    // Invalidate every existing session — a reset must lock out anyone holding old tokens.
    prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    }),
  ]);

  return { message: 'Parol muvaffaqiyatli yangilandi' };
};

/**
 * Request a password reset over the phone (Telegram OTP). Reuses the existing OTP
 * infrastructure but for a RESET intent — unlike registration's request-otp, an
 * already-registered number is exactly who we want to send a code to. A code is
 * only sent when the account actually exists; the response is otherwise a generic
 * message so we never disclose whether a number is registered (enumeration guard).
 * If the number has no linked Telegram chat we can't deliver a code, so we surface
 * that (same 428 as request-otp) — this reveals Telegram-link status, not account
 * existence.
 */
const forgotPasswordByPhone = async (rawPhone) => {
  const genericMessage = 'Agar bu raqam ro\'yxatdan o\'tgan bo\'lsa, tasdiqlash kodi yuborildi';
  const phone = telegramService.normalizePhone(rawPhone);
  if (!phone) throw new ApiError(400, 'Telefon raqam noto\'g\'ri');

  const record = await prisma.phoneAuth.findUnique({ where: { phone } });
  if (!record || !record.telegramChatId) {
    throw new ApiError(428, 'Avval Telegram bot orqali raqamingizni ulang');
  }

  const canonicalPhone = `+${phone}`;
  const user = await prisma.user.findFirst({ where: { phone: canonicalPhone, deletedAt: null } });

  if (user) {
    const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);
    await prisma.phoneAuth.update({
      where: { phone },
      data: { otpCode: code, otpExpiresAt, attempts: 0 },
    });
    await telegramService.sendMessage(
      record.telegramChatId,
      `🔐 <b>TradeS</b> parol tiklash kodi:\n\n<code>${code}</code>\n\nKod ${OTP_EXPIRES_MIN} daqiqa amal qiladi. Hech kimga bermang.`
    );
  }

  return { message: genericMessage };
};

/**
 * Reset a password over the phone: verify the OTP, set the new password, and revoke
 * all refresh sessions (same lock-out semantics as the email token flow). OTP is
 * single-use.
 */
const resetPasswordByPhone = async (rawPhone, code, newPassword) => {
  const phone = telegramService.normalizePhone(rawPhone);
  if (!phone || !code) throw new ApiError(400, 'Telefon va kod talab qilinadi');

  const record = await prisma.phoneAuth.findUnique({ where: { phone } });
  if (!record || !record.otpCode || !record.otpExpiresAt) {
    throw new ApiError(400, 'Avval kod so\'rang');
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, 'Juda ko\'p urinish. Yangi kod so\'rang');
  }
  if (record.otpExpiresAt < new Date()) {
    throw new ApiError(400, 'Kod muddati tugagan. Yangi kod so\'rang');
  }
  if (record.otpCode !== String(code).trim()) {
    await prisma.phoneAuth.update({ where: { phone }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, 'Kod noto\'g\'ri');
  }

  const canonicalPhone = `+${phone}`;
  const user = await prisma.user.findFirst({ where: { phone: canonicalPhone, deletedAt: null } });
  if (!user) throw new ApiError(400, 'Foydalanuvchi topilmadi');

  // OTP correct — clear it (single use)
  await prisma.phoneAuth.update({
    where: { phone },
    data: { otpCode: null, otpExpiresAt: null, attempts: 0 },
  });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    // Invalidate every existing session — a reset must lock out anyone holding old tokens.
    prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    }),
  ]);

  return { message: 'Parol muvaffaqiyatli yangilandi' };
};

/**
 * Request an email OTP — the email-channel analog of requestOtp. A 6-digit code is
 * stored on EmailAuth and delivered via Resend (dev no-op + surfaced code when the
 * provider isn't configured). The response is generic and identical whether or not
 * the address is registered, so it never discloses account existence.
 */
const requestEmailOtp = async (rawEmail) => {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) throw new ApiError(400, 'Email talab qilinadi');

  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

  await prisma.emailAuth.upsert({
    where: { email },
    update: { otpCode: code, otpExpiresAt, attempts: 0 },
    create: { email, otpCode: code, otpExpiresAt, attempts: 0 },
  });

  await emailService.sendCode(email, code);

  const result = { message: 'Tasdiqlash kodi emailga yuborildi' };
  // Dev-safe: without a provider, surface the code so the flow is testable.
  if (!emailService.isConfigured() && process.env.NODE_ENV !== 'production') {
    result.devCode = code;
  }
  return result;
};

/**
 * Verify the email OTP and register-or-login the user by email — the email-channel
 * analog of verifyOtp. New users provide name + password; an existing account that
 * receives a password is a re-registration attempt and is refused (409), mirroring
 * the phone guard. Verifying the code proves ownership, so isEmailVerified is set.
 */
const verifyEmailOtp = async ({ email: rawEmail, code, name, password }, meta = {}) => {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email || !code) throw new ApiError(400, 'Email va kod talab qilinadi');

  const record = await prisma.emailAuth.findUnique({ where: { email } });
  if (!record || !record.otpCode || !record.otpExpiresAt) {
    throw new ApiError(400, 'Avval kod so\'rang');
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, 'Juda ko\'p urinish. Yangi kod so\'rang');
  }
  if (record.otpExpiresAt < new Date()) {
    throw new ApiError(400, 'Kod muddati tugagan. Yangi kod so\'rang');
  }
  if (record.otpCode !== String(code).trim()) {
    await prisma.emailAuth.update({ where: { email }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, 'Kod noto\'g\'ri');
  }

  // OTP correct — clear it (single use)
  await prisma.emailAuth.update({
    where: { email },
    data: { otpCode: null, otpExpiresAt: null, attempts: 0 },
  });

  let user = await prisma.user.findFirst({ where: { email, deletedAt: null } });

  if (!user) {
    if (!password) throw new ApiError(400, 'Ro\'yxatdan o\'tish uchun parol talab qilinadi');
    const hashed = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { name: name || 'Foydalanuvchi', email, password: hashed, isEmailVerified: true },
    });
  } else if (password) {
    throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan. Kirish sahifasi orqali kiring.');
  } else if (!user.isEmailVerified) {
    // Logging in via a code proves ownership — mark the address verified.
    user = await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
  }

  if (user.isBlocked) throw new ApiError(403, 'Hisobingiz bloklangan');

  const { accessToken, refreshToken } = await issueTokens(user, meta);
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const userResponse = { ...user };
  delete userResponse.password;
  return { user: userResponse, accessToken, refreshToken };
};

module.exports = { register, login, refreshTokens, logout, logoutAll, googleAuth, requestOtp, verifyOtp, issueTokens, forgotPassword, resetPassword, forgotPasswordByPhone, resetPasswordByPhone, requestEmailOtp, verifyEmailOtp };
