import axios from "axios";
import { appConfig } from "../config/appConfig";

const STORAGE_KEY = "savdo-admin-auth";

export const http = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000
});

// ── Request interceptor — No longer need to manually attach token ──────────────────
http.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrent 401s (e.g. multiple polling intervals firing at once after the
// tab was backgrounded) must share a single refresh call — the backend's
// refresh-token rotation is single-use, so a second, independent refresh
// call would be rejected as "already used" and wrongly force a logout.
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${appConfig.apiBaseUrl}/auth/refresh-token`, {}, { withCredentials: true })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ── Response interceptor — handle errors + token refresh ─
http.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;

    // 401 — try token refresh (once per request; concurrent requests share one refresh call)
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return http(original);
      } catch {
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }
    }

    // Normalize error
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Xatolik yuz berdi";

    return Promise.reject({ status: error.response?.status, message });
  }
);
