/**
 * Main entry point for the API server
 */

import { startServer } from './app';
import { config } from './config';
import { logger } from './utils/logger';

// Log startup configuration
logger.info(
  {
    environment: config.env,
    port: config.port,
    host: config.host,
    apiPrefix: config.apiPrefix,
    cacheEnabled: config.featureCacheEnabled,
    rateLimitEnabled: config.featureRateLimitEnabled,
    swaggerEnabled: config.featureSwaggerEnabled,
  },
  '🚀 Starting Dashboard API...',
);

// Start the server
startServer().catch((error: unknown) => {
  logger.fatal({ err: error }, '💀 Failed to start server');
  process.exitCode = 1;
});
