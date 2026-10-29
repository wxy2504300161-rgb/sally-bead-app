import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 仅用于单元测试：不引入 Figma 专属插件，避免干扰 jsdom 测试
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
