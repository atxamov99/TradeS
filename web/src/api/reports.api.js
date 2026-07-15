import api from './axios';

export const getSummary = () => api.get('/reports/summary');
export const getDailyReport = (date) => api.get('/reports/daily', { params: { date } });
export const getMonthlyReport = (month) => api.get('/reports/monthly', { params: { month } });
export const getOverview = (params) => api.get('/reports/overview', { params });
export const getAdminActivity = (params) => api.get('/reports/admin-activity', { params });
export const getSecurity = (params) => api.get('/reports/security', { params });
export const exportReport = (params) => api.get('/reports/export', { params, responseType: 'blob' });
