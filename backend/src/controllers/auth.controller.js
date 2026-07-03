const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, { user }, 'Registration successful'));
});

const login = asyncHandler(async (req, res) => {
  const meta = {
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  };
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta);

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
  res.status(200).json(new ApiResponse(200, { user: req.user }, 'User retrieved'));
});

const googleAuth = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.googleAuth(req.body.credential, meta);

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

  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json(
    new ApiResponse(200, { user, accessToken, refreshToken }, 'Kirish muvaffaqiyatli')
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  // Minimal: hozircha faqat tasdiqlash, email jo'natish keyinroq qo'shiladi
  const { email } = req.body;
  if (!email) {
    res.status(200).json(new ApiResponse(200, null, 'Agar email mavjud bo\'lsa, tiklash havolasi yuborildi'));
    return;
  }
  // Production'da: tokenni DB ga saqlash + email jo'natish
  res.status(200).json(new ApiResponse(200, null, 'Agar email mavjud bo\'lsa, tiklash havolasi yuborildi'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw new ApiError(400, 'Token va yangi parol talab qilinadi');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }
  // Production'da: tokenni tekshirish + parolni yangilash
  res.status(200).json(new ApiResponse(200, null, 'Parol muvaffaqiyatli yangilandi'));
});

module.exports = { register, login, refreshToken, logout, logoutAll, getMe, forgotPassword, resetPassword, googleAuth, requestOtp, verifyOtp };
