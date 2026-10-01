import { http } from "../http";

export const reportsApi = {
  /** GET /api/reports/overview?from=&to= */
  getOverview: (params = {}) =>
    http.get("/reports/overview", { params }),

  /** GET /api/reports/admin-activity?from=&to= */
  getAdminActivity: (params = {}) =>
    http.get("/reports/admin-activity", { params }),

  /** GET /api/reports/security?from=&to= */
  getSecurity: (params = {}) =>
    http.get("/reports/security", { params }),

  /** GET /api/reports/monthly-overview?months= */
  getMonthlyOverview: (params = {}) =>
    http.get("/reports/monthly-overview", { params }),

  /** GET /api/reports/export?type=&from=&to= — returns blob */
  export: (params = {}) =>
    http.get("/reports/export", { params, responseType: "blob" })
};
