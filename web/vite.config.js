import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        // Backend's own default is 5000 (backend/.env PORT, server.js). On a Mac where
        // AirPlay Receiver already holds 5000, set BACKEND_PORT=5050 (or whatever) and
        // change backend/.env's PORT to match — don't hardcode a workaround for one
        // machine as everyone else's default (this exact mismatch silently broke the
        // whole web app's API calls before).
        target: `http://localhost:${process.env.BACKEND_PORT || 5000}`,
        changeOrigin: true,
      },
    },
  },
});
