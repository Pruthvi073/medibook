import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for MediBook React frontend.
 *
 * Key config:
 *  - base: reads VITE_BASE_URL for GitHub Pages (e.g. /medibook/).
 *    Falls back to '/' for local development.
 *  - React plugin for JSX/Fast Refresh support.
 *  - Dev-server proxy: all /api/* calls forwarded to Express on port 5000.
 *  - optimizeDeps: pre-bundle heavy dependencies.
 */
export default defineConfig({
  // GitHub Pages deploys to /<repo-name>/, so base must match.
  // VITE_BASE_URL is injected by the GitHub Actions CI workflow.
  base: process.env.VITE_BASE_URL || '/',

  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },

  build: {
    outDir:    'dist',
    sourcemap: false,
  },

  optimizeDeps: {
    include: ['recharts', 'react-is', 'leaflet', 'react-leaflet', 'jspdf'],
    force:   true,
  },
});
