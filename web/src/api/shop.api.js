import api from './axios';

export const getMyShops = () => api.get('/shops');
export const getShopMembers = (shopId) => api.get(`/shops/${shopId}/members`);
export const addShopMember = (shopId, data) => api.post(`/shops/${shopId}/members`, data);
export const removeShopMember = (shopId, userId) => api.delete(`/shops/${shopId}/members/${userId}`);
