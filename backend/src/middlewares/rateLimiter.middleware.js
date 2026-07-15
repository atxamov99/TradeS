const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

/**
 * Key requests by identity, not just source IP. Behind a reverse proxy (Render),
 * many clients can share a source address and NAT'd users would otherwise be
 * throttled collectively — while an authenticated abuser rotating IPs would slip
 * past a pure-IP limiter. So: key on the bearer token (hashed) when the request is
 * authenticated, and fall back to the real client IP (requires `trust proxy`) for
 * anonymous traffic. This needs `app.set('trust proxy', 1)` in server.js so req.ip
 * is the client, not the proxy.
 */
const identityKey = (req) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token) {
    return `tok:${crypto.createHash('sha256').update(token).digest('hex')}`;
  }
  return `ip:${req.ip}`;
};

/**
 * General API rate limiter — 1000 requests per 15 minutes
 * (Admin panel polls every 5s, so 100 was too restrictive)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: identityKey,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Strict auth rate limiter — 20 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: identityKey,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
