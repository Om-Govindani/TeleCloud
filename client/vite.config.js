import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // target: 'https://telecloud-api.vercel.app',
        //target: 'http://localhost:5000',
        target: 'https://telecloud-production-ab69.up.railway.app',
        changeOrigin: true,
        credentials: true
      }
    }
  }
})
