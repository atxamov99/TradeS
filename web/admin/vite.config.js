import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig(({ command, mode }) => {
  // Backend address for the dev proxy. Default 5050 (macOS ControlCenter occupies 5000); override with
  // VITE_PROXY_TARGET in web/admin/.env.local (e.g. http://localhost:5000) so the panel talks to YOUR backend.
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:5050";
  return {
  plugins: [react()],
  base: command === "build" ? "/admin/" : "/",
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      "/api": {
        // Backend runs on 5050 locally — macOS ControlCenter (AirPlay Receiver) occupies 5000
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
};
});
