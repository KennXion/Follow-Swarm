import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy specific auth endpoints to backend, excluding /auth/success which is a frontend route
      '/auth/spotify': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth/callback': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth/status': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth/logout': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth/refresh': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth/revoke': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})