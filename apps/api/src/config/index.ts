/**
 * Configuration management for the API
 * Centralizes all environment variables and settings
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  // Environment
  env: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server
  port: z.coerce.number().min(1).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),
  apiPrefix: z.string().default('/api/v1'),
  
  // Database
  databaseUrl: z.string().startsWith('mysql://').or(z.string().startsWith('postgresql://')),
  databasePoolMin: z.coerce.number().min(1).default(2),
  databasePoolMax: z.coerce.number().min(1).default(10),
  
  // Redis
  redisUrl: z.string().startsWith('redis://').optional().default('redis://localhost:6379'),
  redisTtl: z.coerce.number().min(0).default(300),
  
  // CORS
  corsOrigin: z.string().or(z.array(z.string())).default('http://localhost:5173'),
  corsCredentials: z.coerce.boolean().default(true),
  
  // Rate Limiting
  rateLimitMax: z.coerce.number().min(1).default(100),
  rateLimitWindow: z.coerce.number().min(1000).default(60000), // 1 minute in ms
  
  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  logPretty: z.coerce.boolean().default(true),
  
  // Security
  jwtSecret: z.string().min(32).optional(),
  bcryptRounds: z.coerce.number().min(8).max(15).default(10),
  
  // Feature Flags
  featureCacheEnabled: z.coerce.boolean().default(true),
  featureRateLimitEnabled: z.coerce.boolean().default(true),
  featureSwaggerEnabled: z.coerce.boolean().default(true),
  
  // Monitoring
  sentryDsn: z.string().optional(),
  newRelicLicenseKey: z.string().optional(),
  datadogApiKey: z.string().optional(),
});

// Parse and validate configuration
const parseConfig = () => {
  const env = {
    // Environment
    env: process.env.NODE_ENV,
    
    // Server
    port: process.env.PORT,
    host: process.env.API_HOST,
    apiPrefix: process.env.API_PREFIX,
    
    // Database
    databaseUrl: process.env.DATABASE_URL,
    databasePoolMin: process.env.DATABASE_POOL_MIN,
    databasePoolMax: process.env.DATABASE_POOL_MAX,
    
    // Redis
    redisUrl: process.env.REDIS_URL,
    redisTtl: process.env.REDIS_TTL,
    
    // CORS
    corsOrigin: process.env.CORS_ORIGIN?.includes(',') 
      ? process.env.CORS_ORIGIN.split(',') 
      : process.env.CORS_ORIGIN,
    corsCredentials: process.env.CORS_CREDENTIALS,
    
    // Rate Limiting
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW,
    
    // Logging
    logLevel: process.env.LOG_LEVEL,
    logPretty: process.env.LOG_PRETTY,
    
    // Security
    jwtSecret: process.env.JWT_SECRET,
    bcryptRounds: process.env.BCRYPT_ROUNDS,
    
    // Feature Flags
    featureCacheEnabled: process.env.FEATURE_CACHE_ENABLED,
    featureRateLimitEnabled: process.env.FEATURE_RATE_LIMIT_ENABLED,
    featureSwaggerEnabled: process.env.FEATURE_SWAGGER_ENABLED,
    
    // Monitoring
    sentryDsn: process.env.SENTRY_DSN,
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    datadogApiKey: process.env.DATADOG_API_KEY,
  };
  
  const result = configSchema.safeParse(env);
  
  if (!result.success) {
    console.error('❌ Configuration validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
};

// Export singleton configuration
export const config = parseConfig();

// Type export
export type Config = z.infer<typeof configSchema>;

// Helper functions
export const isDevelopment = () => config.env === 'development';
export const isProduction = () => config.env === 'production';
export const isTest = () => config.env === 'test';
