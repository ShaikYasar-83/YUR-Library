import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy old vanilla HTML pages and assets to the backend
      '^/(.*\\.html|css/.*|js/.*|images/.*)$': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
