import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://trades-backend-m2a6.onrender.com/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  // Render bepul tarifi "sovuq boshlanish"da (uzoq harakatsizlikdan keyin birinchi so'rov)
  // 20-30 soniyagacha vaqt olishi mumkin — 10s juda qisqa edi, ilova ishlamayotgandek
  // ko'rinar edi. 40s'ga oshirdik.
  timeout: 40000,
});

// Request interceptor — JWT token qo'shish
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — token yangilash
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Timeout bo'lsa (masalan Render sovuq boshlanishi) — bitta marta avtomatik qayta urinib ko'ramiz.
    if (error.code === "ECONNABORTED" && original && !original._timeoutRetry) {
      original._timeoutRetry = true;
      return api(original);
    }

    if (error.response?.status === 401 && !original._retry) {
      const token = useAuthStore.getState().token;
      if (token === "demo-token") return Promise.reject(error);

      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data: body } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const payload = body?.data ?? body;
        useAuthStore.getState().setToken(payload.accessToken, payload.refreshToken);
        original.headers.Authorization = `Bearer ${payload.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearToken();
      }
    }
    return Promise.reject(error);
  }
);
