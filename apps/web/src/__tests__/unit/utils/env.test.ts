/**
 * Tests for environment configuration
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// We need to test env config, so we'll mock the import.meta.env
const mockEnv = vi.hoisted(() => ({
  VITE_API_URL: 'http://localhost:3000',
  VITE_APP_ENV: 'development',
  MODE: 'development',
}));

type MutableEnv = Record<keyof typeof mockEnv, string | undefined>;

function setEnv<K extends keyof typeof mockEnv>(key: K, value: string | undefined) {
  (mockEnv as MutableEnv)[key] = value;
}

vi.mock('import.meta.env', () => mockEnv);

describe('env configuration', () => {
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = { ...mockEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.assign(mockEnv, originalEnv);
  });

  it('should use default values when environment variables are not set', async () => {
    // Clear env vars
    setEnv('VITE_API_URL', undefined);
    setEnv('VITE_APP_ENV', undefined);
    setEnv('MODE', 'development');

    // Re-import to get fresh env config
    const { env } = await import('@/lib/env');

    expect(env.apiUrl).toBe('http://localhost:3000');
    expect(env.appEnv).toBe('development');
    expect(env.isDev).toBe(true);
    expect(env.isTest).toBe(false);
    expect(env.isProd).toBe(false);
  });

  it('should use provided environment variables', async () => {
    mockEnv.VITE_API_URL = 'https://api.production.com';
    mockEnv.VITE_APP_ENV = 'production';

    // Clear module cache and re-import
    vi.resetModules();
    const { env } = await import('@/lib/env');

    expect(env.apiUrl).toBe('https://api.production.com');
    expect(env.appEnv).toBe('production');
    expect(env.isDev).toBe(false);
    expect(env.isTest).toBe(false);
    expect(env.isProd).toBe(true);
  });

  it('should handle test environment', async () => {
    mockEnv.VITE_API_URL = 'http://localhost:3001';
    mockEnv.VITE_APP_ENV = 'test';

    vi.resetModules();
    const { env } = await import('@/lib/env');

    expect(env.apiUrl).toBe('http://localhost:3001');
    expect(env.appEnv).toBe('test');
    expect(env.isDev).toBe(false);
    expect(env.isTest).toBe(true);
    expect(env.isProd).toBe(false);
  });

  it('should fallback to MODE when VITE_APP_ENV is not set', async () => {
    setEnv('VITE_APP_ENV', undefined);
    setEnv('MODE', 'production');

    vi.resetModules();
    const { env } = await import('@/lib/env');

    expect(env.appEnv).toBe('production');
    expect(env.isProd).toBe(true);
  });

  it('should validate URL format for API_URL', async () => {
    setEnv('VITE_API_URL', 'not-a-url');

    vi.resetModules();
    
    // This should throw during import due to Zod validation
    await expect(import('@/lib/env')).rejects.toThrow('Invalid frontend environment variables');
  });

  it('should validate environment enum values', async () => {
    setEnv('VITE_APP_ENV', 'invalid-env');

    vi.resetModules();
    
    // This should throw during import due to Zod validation
    await expect(import('@/lib/env')).rejects.toThrow('Invalid frontend environment variables');
  });

  it('should export readonly env object', async () => {
    vi.resetModules();
    const { env } = await import('@/lib/env');

    // env should be a readonly object
    expect(typeof env).toBe('object');
    expect(env).toHaveProperty('apiUrl');
    expect(env).toHaveProperty('appEnv');
    expect(env).toHaveProperty('isDev');
    expect(env).toHaveProperty('isTest');
    expect(env).toHaveProperty('isProd');

    // Properties should be readonly (TypeScript enforced, but we can check they exist)
    expect(env.apiUrl).toBeDefined();
    expect(env.appEnv).toBeDefined();
  });

  it('should handle valid URL variations', async () => {
    const validUrls = [
      'http://localhost:3000',
      'https://api.example.com',
      'https://api.example.com:8080',
      'http://127.0.0.1:3000',
      'https://subdomain.api.example.com/v1',
    ];

    for (const url of validUrls) {
      mockEnv.VITE_API_URL = url;
      vi.resetModules();
      
      const { env } = await import('@/lib/env');
      expect(env.apiUrl).toBe(url);
    }
  });

  it('should handle all valid environment values', async () => {
    const environments: Array<{ env: string; isDev: boolean; isTest: boolean; isProd: boolean }> = [
      { env: 'development', isDev: true, isTest: false, isProd: false },
      { env: 'test', isDev: false, isTest: true, isProd: false },
      { env: 'production', isDev: false, isTest: false, isProd: true },
    ];

    for (const { env: envValue, isDev, isTest, isProd } of environments) {
      mockEnv.VITE_APP_ENV = envValue;
      vi.resetModules();
      
      const { env } = await import('@/lib/env');
      expect(env.appEnv).toBe(envValue);
      expect(env.isDev).toBe(isDev);
      expect(env.isTest).toBe(isTest);
      expect(env.isProd).toBe(isProd);
    }
  });
});
