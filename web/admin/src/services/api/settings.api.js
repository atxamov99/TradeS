import { http } from "../http";

/**
 * Settings API — generic key-value store (backend `/settings`).
 * GET and PUT both just require the single ADMIN role, no higher tier.
 */
export const settingsApi = {
  /** GET /api/v1/settings → { data: { settings: { key: value, ... } } } */
  getAll: () =>
    http.get("/settings"),

  /** GET /api/v1/settings/:key → { data: { key, value } } (value null if unset) */
  get: (key) =>
    http.get(`/settings/${key}`),

  /** PUT /api/v1/settings/:key → { data: { key, value } } */
  put: (key, value) =>
    http.put(`/settings/${key}`, { value }),
};
