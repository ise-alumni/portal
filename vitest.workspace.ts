import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'client',
      include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'server',
      include: ['server/__tests__/**/*.test.ts'],
      environment: 'node',
      globals: true,
      fileParallelism: false,
      env: {
        DATABASE_URL: 'file:test-integration.db',
        BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters-long',
        BETTER_AUTH_URL: 'http://localhost:3000',
      },
    },
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
]);
