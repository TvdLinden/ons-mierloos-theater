import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'shared',
    include: ['lib/**/*.test.ts'],
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['../vitest.setup.ts'],
  },
});
