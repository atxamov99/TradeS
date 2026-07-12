import api from './axios';

export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const getProductBySlug = (slug) => api.get(`/products/slug/${slug}`);
export const getCategories = () => api.get('/products/categories');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
export const restockProduct = (id, quantity) => api.patch(`/products/${id}/restock`, { quantity });
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const addReview = (id, data) => api.post(`/products/${id}/reviews`, data);
