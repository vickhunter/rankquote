import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5199 },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
})
