import { http } from "../http";

export const shopsApi = {
  /** GET /api/v1/admin/shops?page=1&limit=100&search=&blocked= */
  getAll: (params = {}) =>
    http.get("/admin/shops", { params }),

  /** PATCH /api/v1/admin/shops/:id/block */
  block: (id, reason) =>
    http.patch(`/admin/shops/${id}/block`, { reason }),

  /** PATCH /api/v1/admin/shops/:id/unblock */
  unblock: (id) =>
    http.patch(`/admin/shops/${id}/unblock`),
};
