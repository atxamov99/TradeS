import { api } from "@/services/api";

// Requests of the ADMIN part of the app: the same endpoints the website's admin panel uses.
const data = (r: any) => r?.data?.data ?? r?.data;

export const errText = (e: any, fallback = "Error") => e?.response?.data?.message || e?.message || fallback;

export const adminApi = {
  stats: async () => data(await api.get("/admin/stats")),

  users: async (params: any = {}) => data(await api.get("/admin/users", { params: { limit: 100, ...params } })),
  createUser: async (body: any) => data(await api.post("/admin/users", body)),
  updateUser: async (id: string, body: any) => data(await api.patch(`/admin/users/${id}`, body)),
  blockUser: async (id: string) => data(await api.patch(`/admin/users/${id}/block`)),
  unblockUser: async (id: string) => data(await api.patch(`/admin/users/${id}/unblock`)),
  removeUser: async (id: string) => data(await api.delete(`/admin/users/${id}`)),
  setKind: async (id: string, body: { kind: string; shopId?: string }) => data(await api.patch(`/admin/users/${id}/account-kind`, body)),
  shops: async () => (data(await api.get("/admin/shops")) || {}).shops || [],

  admins: async () => data(await api.get("/admin/admins")),
  toggleAdmin: async (id: string) => data(await api.patch(`/admin/admins/${id}/status`)),

  orders: async (params: any = {}) => data(await api.get("/admin/orders", { params: { limit: 50, ...params } })),
  setOrder: async (id: string, body: { orderStatus: string; paymentStatus?: string }) => data(await api.patch(`/admin/orders/${id}/status`, body)),

  products: async (params: any = {}) => data(await api.get("/products", { params: { limit: 100, ...params } })),
  createProduct: async (body: any) => data(await api.post("/products", body)),
  updateProduct: async (id: string, body: any) => data(await api.patch(`/products/${id}`, body)),
  removeProduct: async (id: string) => data(await api.delete(`/products/${id}`)),

  overview: async () => data(await api.get("/reports/overview")),
  security: async () => data(await api.get("/reports/security")),
  activity: async () => data(await api.get("/reports/admin-activity")),

  support: async (params: any = {}) => data(await api.get("/admin/support-messages", { params: { limit: 100, ...params } })),
  reply: async (id: string, reply: string) => data(await api.post(`/admin/support-messages/${id}/reply`, { reply })),
  removeSupport: async (id: string) => data(await api.delete(`/admin/support-messages/${id}`)),

  content: async (params: any = {}) => data(await api.get("/content", { params: { limit: 100, ...params } })),
  createContent: async (body: any) => data(await api.post("/content", body)),
  setContentStatus: async (id: string, status: string) => data(await api.patch(`/content/${id}/status`, { status })),
  removeContent: async (id: string) => data(await api.delete(`/content/${id}`)),

  audit: async (params: any = {}) => data(await api.get("/audit-logs", { params: { limit: 40, ...params } })),

  updateProfile: async (body: any) => data(await api.patch("/users/profile", body)),
  changePassword: async (body: { currentPassword: string; newPassword: string }) => data(await api.patch("/users/change-password", body)),
};
