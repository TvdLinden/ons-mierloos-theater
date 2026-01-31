import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use happy-dom for faster tests (lightweight DOM implementation)
    environment: 'happy-dom',

    // Setup files to run before tests
    setupFiles: ['./vitest.setup.ts'],

    // Test file patterns
    include: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.test.tsx',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: ['node_modules/', '**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
    },

    // Globals (no need to import describe, it, expect, etc.)
    globals: true,

    // Isolate test environment
    isolate: true,

    // Enable reporters
    reporters: ['default'],
  },

  // Path alias resolution (matches Next.js paths)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
