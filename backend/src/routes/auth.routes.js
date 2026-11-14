const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { authLimiter, accountLimiter, codeRequestLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerSchema,
  loginSchema,
  verifyNewDeviceSchema,
  refreshTokenSchema,
  googleSchema,
  requestOtpSchema,
  verifyOtpSchema,
  requestEmailOtpSchema,
  verifyEmailOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  linkEmailRequestSchema, linkPhoneRequestSchema, linkEmailVerifySchema, linkPhoneVerifySchema,
} = require('../validators/auth.validator');

// Public routes
// Open sign-up with an UNVERIFIED phone/email let anyone create an account on somebody else's number or
// address (pre-hijack) and mint unlimited fake accounts. Real sign-up goes through the code flows
// (request-otp / request-email-otp), which prove ownership first.
router.post('/register', (req, res) => res.status(410).json({ success: false, statusCode: 410, message: 'Use sign-up with a confirmation code', code: 'USE_CODE_SIGNUP' }));
router.post('/register-test', authLimiter, authController.registerTestUser);
router.post('/login', authLimiter, accountLimiter, validate(loginSchema), authController.login);
router.post('/verify-new-device', authLimiter, accountLimiter, validate(verifyNewDeviceSchema), authController.verifyNewDeviceLogin);
router.post('/google', authLimiter, validate(googleSchema), authController.googleAuth);
router.post('/request-otp', authLimiter, codeRequestLimiter, validate(requestOtpSchema), authController.requestOtp);
router.post('/verify-otp', authLimiter, accountLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/request-email-otp', authLimiter, codeRequestLimiter, validate(requestEmailOtpSchema), authController.requestEmailOtp);
router.post('/verify-email-otp', authLimiter, accountLimiter, validate(verifyEmailOtpSchema), authController.verifyEmailOtp);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authLimiter, codeRequestLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, accountLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Logout must work for a BLOCKED account too (the ban screen has a "Log out" button): it only revokes the
// refresh token that is sent along and clears cookies, so it needs no authenticated user.
router.post('/logout', authLimiter, authController.logout);

// Protected routes
router.use(protect);
router.post('/logout-all', authController.logoutAll);
router.get('/sessions', authController.listSessions);
router.post('/sessions/:id/revoke', authController.revokeSession);
router.get('/me', authController.getMe);
router.post('/sso-adopt', authController.ssoAdopt);

// Link a second login identifier (phone <-> email): password + code on the NEW identifier
router.post('/link/email/request', authLimiter, codeRequestLimiter, validate(linkEmailRequestSchema), authController.requestLinkEmail);
router.post('/link/email/verify', authLimiter, accountLimiter, validate(linkEmailVerifySchema), authController.verifyLinkEmail);
router.post('/link/phone/request', authLimiter, codeRequestLimiter, validate(linkPhoneRequestSchema), authController.requestLinkPhone);
router.post('/link/phone/verify', authLimiter, accountLimiter, validate(linkPhoneVerifySchema), authController.verifyLinkPhone);

module.exports = router;
