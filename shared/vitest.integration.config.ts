import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'shared-integration',
    include: ['lib/**/*.integration.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: {
      DOCKER_HOST: `unix://${process.env.HOME}/.colima/default/docker.sock`,
      TESTCONTAINERS_RYUK_DISABLED: 'true',
    },
  },
});
