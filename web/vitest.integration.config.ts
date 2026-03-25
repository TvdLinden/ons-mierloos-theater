import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'web-integration',
    include: ['**/*.integration.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: {
      DOCKER_HOST: `unix://${process.env.HOME}/.colima/default/docker.sock`,
      TESTCONTAINERS_RYUK_DISABLED: 'true',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@ons-mierloos-theater/shared': path.resolve(__dirname, '../shared/lib'),
    },
  },
});
