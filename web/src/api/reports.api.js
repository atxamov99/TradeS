import api from './axios';

export const getSummary = (shopId) => api.get('/reports/summary', { params: { shopId } });
export const getDailyReport = (date, shopId) => api.get('/reports/daily', { params: { date, shopId } });
export const getMonthlyReport = (month, shopId) => api.get('/reports/monthly', { params: { month, shopId } });
export const getOverview = (params) => api.get('/reports/overview', { params });
export const getAdminActivity = (params) => api.get('/reports/admin-activity', { params });
export const getSecurity = (params) => api.get('/reports/security', { params });
export const exportReport = (params) => api.get('/reports/export', { params, responseType: 'blob' });
