import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-ethers': ['ethers'],
          'vendor-charts': ['lightweight-charts'],
          'vendor-toast':  ['react-hot-toast'],
        }
      }
    },
    chunkSizeWarningLimit: 800,
  }
})
