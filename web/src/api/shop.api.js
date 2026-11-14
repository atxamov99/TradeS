import api from './axios';

export const getMyShops = () => api.get('/shops');
export const getShopMembers = (shopId) => api.get(`/shops/${shopId}/members`);
// Employees are invited, never added directly: the invited user must accept.
export const inviteShopMember = (shopId, data) => api.post(`/shops/${shopId}/invites`, data);
export const getShopInvites = (shopId) => api.get(`/shops/${shopId}/invites`);
export const cancelShopInvite = (shopId, inviteId) => api.delete(`/shops/${shopId}/invites/${inviteId}`);
export const getMyInvites = () => api.get('/shops/invites/mine');
export const acceptInvite = (inviteId) => api.post(`/shops/invites/${inviteId}/accept`);
export const declineInvite = (inviteId) => api.post(`/shops/invites/${inviteId}/decline`);
export const removeShopMember = (shopId, userId) => api.delete(`/shops/${shopId}/members/${userId}`);
export const requestBusinessUpgrade = (shopId) => api.post(`/shops/${shopId}/upgrade/request`);
export const confirmBusinessUpgrade = (shopId, data) => api.post(`/shops/${shopId}/upgrade/confirm`, data);
export const getExpenses = (shopId, params) => api.get(`/shops/${shopId}/expenses`, { params });
export const addExpense = (shopId, data) => api.post(`/shops/${shopId}/expenses`, data);
export const deleteExpense = (shopId, expenseId) => api.delete(`/shops/${shopId}/expenses/${expenseId}`);
