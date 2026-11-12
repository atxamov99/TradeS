const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (payload) => {
  // jti makes every refresh token unique. Without it two tokens for the same user
  // issued in the same second (double-click login, signup + auto-login, parallel
  // refresh) are byte-identical and violate RefreshToken.token @unique -> 409.
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
