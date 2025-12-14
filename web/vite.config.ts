import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 检查是否需要使用 polling 模式（通过环境变量控制）
const usePolling = process.env.VITE_USE_POLLING === 'true'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    watch: usePolling ? {
      usePolling: true,
    } : undefined,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
