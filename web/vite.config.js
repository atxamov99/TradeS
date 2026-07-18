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
        // Backend runs on 5050 — port 5000 is taken by macOS AirPlay Receiver (returns 403).
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
});
