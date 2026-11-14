import api from './axios';

export const getMyShops = () => api.get('/shops');
export const getShopMembers = (shopId) => api.get(`/shops/${shopId}/members`);
export const addShopMember = (shopId, data) => api.post(`/shops/${shopId}/members`, data);
export const removeShopMember = (shopId, userId) => api.delete(`/shops/${shopId}/members/${userId}`);
export const requestBusinessUpgrade = (shopId) => api.post(`/shops/${shopId}/upgrade/request`);
export const confirmBusinessUpgrade = (shopId, data) => api.post(`/shops/${shopId}/upgrade/confirm`, data);
export const getExpenses = (shopId, params) => api.get(`/shops/${shopId}/expenses`, { params });
export const addExpense = (shopId, data) => api.post(`/shops/${shopId}/expenses`, data);
export const deleteExpense = (shopId, expenseId) => api.delete(`/shops/${shopId}/expenses/${expenseId}`);
