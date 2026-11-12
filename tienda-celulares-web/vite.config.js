import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto de tu API (PORT en el .env de la API).
const API_TARGET = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo la web y la API parecen el mismo sitio: no hace falta configurar CORS.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
});
