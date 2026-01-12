import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/v2/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://mcp.sosilab.synology.me',
        changeOrigin: true,
        secure: false,
      },
      '/oauth': {
        target: 'https://mcp.sosilab.synology.me',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'https://mcp.sosilab.synology.me',
        changeOrigin: true,
        secure: false,
      },
      '/oauth': {
        target: 'https://mcp.sosilab.synology.me',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
