import { tx } from "../i18n";
import axios from "axios";
import { appConfig } from "../config/appConfig";

const STORAGE_KEY = "savdo-admin-auth";
const TOKENS_KEY = "savdo-admin-tokens";

// The panel keeps its OWN tokens and sends them as a Bearer header. Cookies are shared by every localhost
// port, so a login on the website (as a normal user) used to silently replace the admin's cookie and every
// admin action then failed with "Role USER is not authorized". A Bearer header always wins over cookies.
export const adminTokens = {
  get() {
    try { return JSON.parse(window.localStorage.getItem(TOKENS_KEY) || "null"); } catch { return null; }
  },
  set(tokens) {
    try { window.localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })); } catch { /* ignore */ }
  },
  clear() {
    try { window.localStorage.removeItem(TOKENS_KEY); } catch { /* ignore */ }
  }
};

export const http = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000
});

// ── Request interceptor — No longer need to manually attach token ──────────────────
http.interceptors.request.use(
  (config) => {
    const tokens = adminTokens.get();
    if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors + token refresh ─
http.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;

    // 401 — try token refresh (once)
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Cookies are sent automatically with withCredentials: true (if configured in axios.create)
        // But let's ensure the base axios call for refresh is correct
        const stored = adminTokens.get();
        const refreshed = await axios.post(
          `${appConfig.apiBaseUrl}/auth/refresh-token`,
          stored?.refreshToken ? { refreshToken: stored.refreshToken } : {},
          { withCredentials: true }
        );
        const fresh = refreshed.data?.data;
        if (fresh?.accessToken) {
          adminTokens.set(fresh);
          original.headers.Authorization = `Bearer ${fresh.accessToken}`;
        }
        return http(original);
      } catch {
        adminTokens.clear();
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }
    }

    // Normalize error
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      tx("msg.xatolik_yuz_berdi");

    return Promise.reject({ status: error.response?.status, message });
  }
);
