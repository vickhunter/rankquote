import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/rankquote/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 5199 },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
}))
