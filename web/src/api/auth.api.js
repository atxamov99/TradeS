import api from './axios';

export const register = (data) => api.post('/auth/register', data);
export const registerTestUser = () => api.post('/auth/register-test');
export const login = (data) => api.post('/auth/login', data);
export const requestOtp = (phone) => api.post('/auth/request-otp', { phone });
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const requestEmailOtp = (email) => api.post('/auth/request-email-otp', { email });
export const verifyEmailOtp = (data) => api.post('/auth/verify-email-otp', data);
export const logout = (data) => api.post('/auth/logout', data);
export const refreshToken = (data) => api.post('/auth/refresh-token', data);
export const getMe = () => api.get('/auth/me');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
