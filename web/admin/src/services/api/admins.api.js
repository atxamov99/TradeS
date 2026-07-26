import { http } from "../http";

/**
 * Admins API — GET/PATCH /api/admins.
 * There is exactly one ADMIN account system-wide (owner decision) — creating
 * one is CLI-only (`node src/seedAdmin.js`), so there is no `create()` here;
 * the backend has no `/admin/register-admin` route to call anymore.
 */

export const adminsApi = {
  /** GET /api/v1/admin/admins */
  getAll: () =>
    http.get("/admin/admins"),

  /** PATCH /api/v1/admin/admins/:id/status */
  toggleStatus: (id) =>
    http.patch(`/admin/admins/${id}/status`)
};
