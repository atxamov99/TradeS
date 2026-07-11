export const appConfig = {
  appName: "TradeS Control",
  appDescription: "Role-based admin and super admin panel for TradeS",
  // Dev: http://localhost:5000/api/v1  |  Docker/Prod: /api/v1 (nginx proxy)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1"
};
