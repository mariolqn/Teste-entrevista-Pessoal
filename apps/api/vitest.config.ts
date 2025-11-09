import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules',
        'dist',
        'tests',
        'prisma/**',
        'scripts/**',
        'src/index.ts',
        'src/lib/prisma.ts',
        'src/lib/redis.ts',
        '*.config.ts',
        '*.config.js',
      ],
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 60,
        lines: 80,
      },
    },
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'prisma'],
    testTimeout: 30000,
    hookTimeout: 60000,
    isolate: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
