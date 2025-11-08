/**
 * Main entry point for the API server
 */

import { startServer } from './app';
import { logger } from './utils/logger';
import { config } from './config';

// Log startup configuration
logger.info({
  environment: config.env,
  port: config.port,
  host: config.host,
  apiPrefix: config.apiPrefix,
  cacheEnabled: config.featureCacheEnabled,
  rateLimitEnabled: config.featureRateLimitEnabled,
  swaggerEnabled: config.featureSwaggerEnabled,
}, '🚀 Starting Dashboard API...');

// Start the server
startServer().catch((error) => {
  logger.fatal(error, '💀 Failed to start server');
  process.exit(1);
});
