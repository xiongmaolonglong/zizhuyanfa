import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 生产环境通过 VITE_BASE_PATH 控制子路径（如 /client/）
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [vue()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) return 'element-plus'
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) return 'vue-vendor'
          }
        },
      },
    },
  },
})
