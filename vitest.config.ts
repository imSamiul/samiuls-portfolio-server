import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(
        new URL('./src/shared/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    // Keeps the suite self-contained: config/env validates before any test
    // runs, and these win because dotenv never overrides existing keys.
    env: {
      NODE_ENV: 'test',
      DB_URL: 'mongodb://127.0.0.1:27017/portfolio-test',
      JWT_TOKEN: 'test-only-jwt-secret',
      ADMIN_EMAIL: 'admin@example.com',
      CORS_ORIGIN: 'http://localhost:3002',
      // The Resend SDK itself is mocked; these only get the service past its
      // "not configured" guard.
      RESEND_API_KEY: 'test-only-resend-key',
      CONTACT_FROM_EMAIL: 'onboarding@resend.dev',
      // Only so `cloudinary.url()` can build delivery URLs, which is pure
      // string work. Never exercise an upload path in a test: with these set it
      // would reach the network instead of stopping at the guard.
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-only-key',
      CLOUDINARY_API_SECRET: 'test-only-secret',
    },
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    // mongodb-memory-server downloads a binary on first run.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
