import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API requests during development to avoid CORS
      '/api': {
        target: 'http://n3dmelbourne.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
