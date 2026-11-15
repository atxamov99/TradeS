import { http } from "../http";

export const usersApi = {
  /** GET /api/admin/users?page=1&limit=50&search= */
  getAll: (params = {}) =>
    http.get("/admin/users", { params }),

  /** POST /api/admin/users */
  create: (data) =>
    http.post("/admin/users", data),

  /** GET /api/admin/users/:id */
  getById: (id) =>
    http.get(`/admin/users/${id}`),

  /** PATCH /api/admin/users/:id/block */
  block: (id) =>
    http.patch(`/admin/users/${id}/block`),

  /** PATCH /api/admin/users/:id/unblock */
  unblock: (id) =>
    http.patch(`/admin/users/${id}/unblock`),

  /** PATCH /api/admin/users/:id */
  update: (id, data) =>
    http.patch(`/admin/users/${id}`, data),

  /** PATCH /api/admin/users/:id/account-kind  { kind: USER|DIRECTOR|CASHIER|ADMIN, shopId? } */
  setKind: (id, data) =>
    http.patch(`/admin/users/${id}/account-kind`, data),

  /** GET /api/admin/shops — business shops (for attaching a cashier) */
  getShops: () =>
    http.get("/admin/shops"),

  /** DELETE /api/admin/users/:id */
  remove: (id) =>
    http.delete(`/admin/users/${id}`),
};
