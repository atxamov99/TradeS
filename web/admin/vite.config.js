import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/admin/" : "/",
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      "/api": {
        // Backend runs on 5050 locally — macOS ControlCenter (AirPlay Receiver) occupies 5000
        target: "http://localhost:5050",
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
}));
