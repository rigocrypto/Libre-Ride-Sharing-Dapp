import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
  test: {
    // Exclude Playwright E2E specs and node_modules from the unit test runner
    exclude: ['node_modules/**', 'tests/playwright/**'],
    // Only include project tests to avoid running upstream package tests
    include: [
      'server/**/*.test.{ts,tsx,js}',
      'server/**/*.spec.{ts,tsx,js}',
      'shared/**/*.test.{ts,tsx,js}',
      'shared/**/*.spec.{ts,tsx,js}',
      'tests/**/*.test.{ts,tsx,js}',
      'tests/**/*.spec.{ts,tsx,js}'
    ],
    environment: 'node',
  },
});
