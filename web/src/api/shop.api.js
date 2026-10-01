import api from './axios';

// Buyer-facing marketplace: all non-blocked shops.
export const getShops = (params) => api.get('/shops', { params });
export const getShopById = (id) => api.get(`/shops/${id}`);
export const getShopProducts = (id, params) => api.get(`/shops/${id}/products`, { params });

// Seller-facing: shops the logged-in user owns.
export const getMyShops = () => api.get('/shops/mine');
export const createShop = (data) => api.post('/shops', data);
export const updateShop = (id, data) => api.patch(`/shops/${id}`, data);
export const getShopOrders = (id, params) => api.get(`/shops/${id}/orders`, { params });
export const updateShopOrderStatus = (shopId, orderId, orderStatus) =>
  api.patch(`/shops/${shopId}/orders/${orderId}/status`, { orderStatus });
export const getShopSales = (id, params) => api.get(`/shops/${id}/sales`, { params });
