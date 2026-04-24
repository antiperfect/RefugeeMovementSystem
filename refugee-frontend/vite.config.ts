import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/unhcr': {
        target: 'https://api.unhcr.org/population/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/unhcr/, ''),
      },
      '/api/flask': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flask/, ''),
      },
      '/api/gdelt': {
        target: 'https://api.gdeltproject.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gdelt/, ''),
      },
      '/api/reliefweb': {
        target: 'https://api.reliefweb.int',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reliefweb/, ''),
      },
    },
  },
})
