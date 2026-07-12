const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { TEST_USER_ACTION_CAP } = require('../utils/testUserLimits');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  if (user.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;
  res.status(201).json(new ApiResponse(201, { user }, 'Registration successful'));
});

const registerTestUser = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.registerTestUser(meta);
  if (user.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(201).json(new ApiResponse(201, { user, accessToken, refreshToken }, 'Test account created'));
});

const login = asyncHandler(async (req, res) => {
  const meta = {
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  };
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta);
  if (user.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;

  // Web/admin use the httpOnly cookies; native mobile (no cookie jar) reads the
  // tokens from the body and sends them as a Bearer header. Returning both keeps
  // one login endpoint working for every client.
  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json(
    new ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful')
  );
});

const refreshToken = asyncHandler(async (req, res) => {
  // Cookie (web/admin) OR body (native mobile) — support both clients.
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'No refresh token provided');
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshTokens(incomingRefreshToken);

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

  res.status(200).json(
    new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Tokens refreshed')
  );
});

const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.body.refreshToken || req.cookies?.refreshToken;

  await authService.logout(incomingRefreshToken);

  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.clearCookie('refreshToken');
  res.status(200).json(new ApiResponse(200, null, 'Logged out from all devices'));
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user?.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;
  res.status(200).json(new ApiResponse(200, { user }, 'User retrieved'));
});

// Mobile app is already logged in (holds a Bearer accessToken) and wants to
// open the web admin panel, which only trusts httpOnly cookies. `protect`
// verified the Bearer token above; here we just mint a fresh cookie session
// for whichever browser/webview made this call.
const ssoAdopt = asyncHandler(async (req, res) => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new ApiError(403, 'Admin panelga kirish uchun ruxsat yo\'q');
  }

  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { accessToken, refreshToken } = await authService.issueTokens(req.user, meta);

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json(new ApiResponse(200, { user: req.user }, 'SSO muvaffaqiyatli'));
});

const googleAuth = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.googleAuth(req.body.credential, meta);
  if (user.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json(
    new ApiResponse(200, { user, accessToken, refreshToken }, 'Google orqali kirish muvaffaqiyatli')
  );
});

const requestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, 'Telefon raqam talab qilinadi');
  const result = await authService.requestOtp(phone);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.verifyOtp(req.body, meta);
  if (user.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json(
    new ApiResponse(200, { user, accessToken, refreshToken }, 'Kirish muvaffaqiyatli')
  );
});

const requestEmailOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email talab qilinadi');
  const result = await authService.requestEmailOtp(email);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.verifyEmailOtp(req.body, meta);
  if (user.isTestUser) user.testActionCap = TEST_USER_ACTION_CAP;

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json(
    new ApiResponse(200, { user, accessToken, refreshToken }, 'Kirish muvaffaqiyatli')
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  // Phone flow → Telegram OTP; email flow → reset token. Phone takes precedence
  // when both are somehow sent.
  const result = phone
    ? await authService.forgotPasswordByPhone(phone)
    : await authService.forgotPassword(email);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, phone, code } = req.body;

  if (phone) {
    // Phone reset: verify the OTP code instead of a token.
    if (!code || !password) {
      throw new ApiError(400, 'Telefon, kod va yangi parol talab qilinadi');
    }
    if (password.length < 6) {
      throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }
    const result = await authService.resetPasswordByPhone(phone, code, password);
    return res.status(200).json(new ApiResponse(200, null, result.message));
  }

  if (!token || !password) {
    throw new ApiError(400, 'Token va yangi parol talab qilinadi');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }
  const result = await authService.resetPassword(token, password);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = { register, registerTestUser, login, refreshToken, logout, logoutAll, getMe, forgotPassword, resetPassword, googleAuth, requestOtp, verifyOtp, requestEmailOtp, verifyEmailOtp, ssoAdopt };
