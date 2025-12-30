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
    watch: {
      // 明确排除不需要监视的目录
      ignored: [
        // 标准排除项（不影响开发）
        '**/node_modules/**',      // 依赖包
        '**/.git/**',              // Git 元数据
        '**/dist/**',              // 构建输出
        '**/build/**',             // 构建输出
        '**/.vscode/**',           // IDE 配置
        '**/.idea/**',             // IDE 配置
        
        // 项目特定排除项（不是前端源码）
        '**/output/**',            // PPT 输出目录
        '**/test_output/**',       // 测试输出目录
        '**/__pycache__/**',       // Python 缓存
        '**/venv/**',              // Python 虚拟环境
        '**/.venv/**',             // Python 虚拟环境
        '**/temp_buid_note/**',    // 临时笔记
        
        // 只排除当前项目外的 node_modules（更精确）
        // 不使用 ../../** 避免误伤
      ],
      ...(usePolling ? { usePolling: true } : {}),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
