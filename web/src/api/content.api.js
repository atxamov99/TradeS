import api from './axios';

// Public: published content only (help/FAQ articles, home banner) — no login required.
export const getPublicContent = (params) => api.get('/content/public', { params });
