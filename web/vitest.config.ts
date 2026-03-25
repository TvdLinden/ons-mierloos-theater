import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'web',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/*.integration.test.ts', 'node_modules', '.next'],
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
