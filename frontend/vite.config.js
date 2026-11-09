import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configure Vite and the browser-like environment for React component tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
  },
})
