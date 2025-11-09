import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE ?? 'development',
});

if (!parsed.success) {
  // eslint-disable-next-line no-console -- surface configuration issues early
  console.error('Invalid frontend environment variables', parsed.error.flatten());
  throw new Error('Invalid frontend environment variables');
}

const { VITE_API_URL, VITE_APP_ENV } = parsed.data;

export const env = {
  apiUrl: VITE_API_URL,
  appEnv: VITE_APP_ENV,
  isDev: VITE_APP_ENV === 'development',
  isTest: VITE_APP_ENV === 'test',
  isProd: VITE_APP_ENV === 'production',
} as const;

