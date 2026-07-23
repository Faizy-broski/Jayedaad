import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // e2e/ runs under Playwright, not Vitest — excluded so `vitest run`
    // doesn't try to execute Playwright specs as unit tests.
    exclude: ['node_modules/**', 'e2e/**'],
  },
});
