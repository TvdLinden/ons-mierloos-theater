import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'worker',
    include: ['lib/**/*.test.ts'],
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['../vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@ons-mierloos-theater/shared': path.resolve(__dirname, '../shared/lib'),
    },
  },
});
