import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/auth/' : '/',
  build: {
    outDir: '../public/auth',
    emptyOutDir: true,
  },
  server: {
    port: 4000,
    proxy: {
      '/api/auth': {
        target: 'https://frogger-backend.fly.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}));
