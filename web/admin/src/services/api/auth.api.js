import { http } from "../http";

/**
 * Auth API — backend bilan ishlash uchun
 * Hozircha mock (demo) rejimda, backend tayyor bo'lganda shu funksiyalar chaqiriladi
 */

export const authApi = {
  /** POST /api/auth/login (email or phone + password) */
  login: (credentials) =>
    http.post("/auth/login", credentials),

  /** POST /api/auth/logout */
  logout: () =>
    http.post("/auth/logout"),

  /** POST /api/auth/refresh-token */
  refresh: (refreshToken) =>
    http.post("/auth/refresh-token", { refreshToken }),

  /** POST /api/auth/forgot-password */
  forgotPassword: (email) =>
    http.post("/auth/forgot-password", { email }),

  /** POST /api/auth/reset-password */
  resetPassword: (token, newPassword) =>
    http.post("/auth/reset-password", { token, password: newPassword }),

  /** GET /api/auth/me */
  getMe: () =>
    http.get("/auth/me"),

  /** PATCH /api/users/profile — update own profile */
  updateProfile: (data) =>
    http.patch("/users/profile", data),

  /** PATCH /api/users/change-password */
  changePassword: (data) =>
    http.patch("/users/change-password", data)
};
