import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line import/no-default-export -- Vite expects default export
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tsconfigPaths(),
    ],
    server: {
      host: env.VITE_DEV_SERVER_HOST ?? '0.0.0.0',
      port: Number(env.VITE_DEV_SERVER_PORT ?? 5173),
      strictPort: true,
    },
    preview: {
      host: env.VITE_DEV_SERVER_HOST ?? '0.0.0.0',
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 900,
      target: 'es2020',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      css: true,
      coverage: {
        reporter: ['text', 'lcov'],
        provider: 'v8',
        exclude: ['tests/**', '**/__mocks__/**'],
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  };
});

