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
        target: 'https://n3d.vercel.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
