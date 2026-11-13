import api from './axios';

// Telegram sign-in code on/off. Turning it OFF needs the account password.
export const setLoginCode = (enabled, password) => api.patch('/users/security', { enabled, ...(password ? { password } : {}) });
