const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('./audit.service');

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
    user = await prisma.user.findUnique({ where: { email } });
  } else if (phone) {
    user = await prisma.user.findFirst({ where: { phone } });
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

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.isBlocked) {
    throw new ApiError(401, 'User not found or blocked');
  }

  const tokenPayload = { id: user.id, role: user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
      userAgent: storedToken.userAgent,
      ip: storedToken.ip,
    },
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

module.exports = { register, login, refreshTokens, logout, logoutAll, googleAuth };
