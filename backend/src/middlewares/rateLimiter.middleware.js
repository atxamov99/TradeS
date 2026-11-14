const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
    // Only a token that really verifies identifies a user. A forged / random token must NOT
    // open a fresh bucket (that let an attacker rotate fake tokens to dodge every limit).
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded && decoded.id) return 'user:' + decoded.id;
    } catch (_) { /* fall through to IP */ }
  }
  return 'ip:' + req.ip;
};

// Key by the account being attacked (phone digits / email), so one account cannot be brute-forced
// from many IPs and one victim cannot be spammed with codes. Falls back to the IP when absent.
const accountKey = (req) => {
  const b = req.body || {};
  const raw = b.email || b.phone || '';
  const k = String(raw).toLowerCase().replace(/\s+/g, '');
  const digits = k.replace(/\D/g, '');
  const norm = k.includes('@') ? k : digits || k;
  return norm ? 'acct:' + crypto.createHash('sha256').update(norm).digest('hex') : 'ip:' + req.ip;
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

/**
 * Contact-support rate limiter — 3 messages per 15 minutes per IP.
 * This forwards straight to a real person's Telegram, so it needs to be
 * strict enough to block someone spamming garbage.
 */
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many support messages. Please try again later.',
  },
});

/**
 * Per-ACCOUNT limiter for login / code requests / code checks: 10 per 15 minutes per phone or email,
 * no matter how many IPs the attacker uses.
 */
const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountKey,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many attempts for this account. Please try again after 15 minutes.',
  },
});

/**
 * Sending codes (Telegram / email) costs money and can be used to spam a victim: 5 per hour per account.
 */
const codeRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountKey,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many code requests. Please try again later.',
  },
});

/**
 * AI assistant: every call costs money — 20 per hour per user.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: identityKey,
  message: {
    success: false,
    statusCode: 429,
    message: 'AI request limit reached. Please try again later.',
  },
});

module.exports = { apiLimiter, authLimiter, supportLimiter, accountLimiter, codeRequestLimiter, aiLimiter };
