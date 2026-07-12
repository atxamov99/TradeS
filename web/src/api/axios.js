import axios from 'axios';
import toast from 'react-hot-toast';
import i18n from '../i18n';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const ERROR_CODE_KEYS = {
  ACCOUNT_NOT_FOUND: 'error_account_not_found',
  WRONG_PASSWORD: 'error_wrong_password',
  ACCOUNT_EXISTS: 'error_account_exists',
  ACCOUNT_BLOCKED: 'error_account_blocked',
  BAG_WEIGHT_REQUIRED: 'bag_weight_required',
  TEST_USER_EXPIRED: 'error_test_user_expired',
  INSUFFICIENT_STOCK: 'error_insufficient_stock',
};

// Prefer a translated string for known error codes so the message respects
// the active locale instead of showing the backend's raw (Uzbek) text.
export const resolveErrorMessage = (error) => {
  const code = error.response?.data?.code;
  if (code && ERROR_CODE_KEYS[code]) return i18n.t(ERROR_CODE_KEYS[code]);
  return error.response?.data?.message || 'Something went wrong';
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — No longer need to manually attach token ──────────────────────
api.interceptors.request.use((config) => {
  return config;
});

// ── Response interceptor — handle 401 / refresh ───────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Auth endpoints where a 401 means bad credentials, not an expired session.
// Attempting a token refresh (and redirect) for these would cause loops.
const AUTH_PATHS = [
  '/auth/login', '/auth/register', '/auth/refresh-token',
  '/auth/request-otp', '/auth/verify-otp',
  '/auth/request-email-otp', '/auth/verify-email-otp',
];
const isAuthEndpoint = (url = '') => AUTH_PATHS.some((p) => url.includes(p));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Since we use HttpOnly cookies, we don't need to manually set the header
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookies are sent automatically with withCredentials: true
        await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Guard against a redirect loop when we're already on the login page.
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const status = error.response?.status;
    if (status !== 401 && status !== 422) {
      toast.error(resolveErrorMessage(error));
    }

    return Promise.reject(error);
  }
);

export default api;
