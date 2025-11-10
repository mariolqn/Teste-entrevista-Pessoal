import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000'),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const rawEnv: z.input<typeof envSchema> = {
  VITE_API_URL: import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000',
  VITE_APP_ENV: import.meta.env['VITE_APP_ENV'] ?? import.meta.env['MODE'] ?? 'development',
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  // eslint-disable-next-line no-console -- surface configuration issues early
  console.error('Invalid frontend environment variables', parsed.error.flatten());
  throw new Error('Invalid frontend environment variables');
}

const envData = parsed.data;

export const env = {
  apiUrl: envData.VITE_API_URL,
  appEnv: envData.VITE_APP_ENV,
  isDev: envData.VITE_APP_ENV === 'development',
  isTest: envData.VITE_APP_ENV === 'test',
  isProd: envData.VITE_APP_ENV === 'production',
} as const;
