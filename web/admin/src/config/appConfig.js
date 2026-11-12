export const appConfig = {
  appName: "Savdo Control",
  appDescription: "Admin panel for TradeS",
  // Dev: http://localhost:5000/api/v1  |  Docker/Prod: /api/v1 (nginx proxy)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1"
};
