import api from './axios';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const requestOtp = (phone) => api.post('/auth/request-otp', { phone });
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const logout = (data) => api.post('/auth/logout', data);
export const refreshToken = (data) => api.post('/auth/refresh-token', data);
export const getMe = () => api.get('/auth/me');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
