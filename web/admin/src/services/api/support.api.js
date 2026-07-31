import { http } from "../http";

export const supportApi = {
  /** GET /api/admin/support-messages?status=&page=1&limit=20 */
  getAll: (params = {}) =>
    http.get("/admin/support-messages", { params }),

  /** POST /api/admin/support-messages/:id/reply */
  reply: (id, reply) =>
    http.post(`/admin/support-messages/${id}/reply`, { reply }),

  /** DELETE /api/admin/support-messages/:id (SUPER_ADMIN only) */
  remove: (id) =>
    http.delete(`/admin/support-messages/${id}`),
};
