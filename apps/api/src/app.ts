/**
 * Main Fastify application setup
 * Configures all middleware, plugins, and routes
 */

import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './utils/errors';
import { connectDatabase, disconnectDatabase } from './lib/prisma';
import { connectRedis, disconnectRedis } from './lib/redis';

// Import routes
import { healthRoutes } from './routes/health.routes';
import { chartRoutes } from './routes/chart.routes';

/**
 * Build the Fastify application
 */
export async function buildApp(): Promise<FastifyInstance> {
  // Create Fastify instance
  const fastifyOptions: FastifyServerOptions = {
    logger: logger as any,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    trustProxy: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
        allErrors: true,
      },
    },
  };

  const app = Fastify(fastifyOptions);

  // Register error handlers
  app.setErrorHandler(errorHandler as any);
  app.setNotFoundHandler(notFoundHandler as any);

  // Register core plugins
  await app.register(sensible);

  // CORS configuration
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: config.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
  });

  // Security headers with Helmet
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // Rate limiting
  if (config.featureRateLimitEnabled) {
    await app.register(rateLimit, {
      max: config.rateLimitMax,
      timeWindow: config.rateLimitWindow,
      cache: 10000,
      allowList: ['127.0.0.1', '::1'], // Whitelist localhost
      redis: config.featureCacheEnabled ? (await import('./lib/redis')).redis : undefined,
      keyGenerator: (request) => {
        return request.ip + ':' + request.routerPath;
      },
      errorResponseBuilder: (request, context) => {
        return {
          type: 'https://api.dashboard.com/errors/rate-limit',
          title: 'Too Many Requests',
          status: 429,
          detail: `Rate limit exceeded. Max ${context.max} requests per ${context.after}`,
          instance: request.url,
          retryAfter: context.after,
        };
      },
    });
  }

  // Request/Response hooks
  app.addHook('onRequest', async (request, reply) => {
    // Add request start time
    reply.startTime = Date.now();
    
    // Log incoming request
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }, 'Incoming request');
  });

  app.addHook('onResponse', async (request, reply) => {
    // Calculate response time
    const responseTime = reply.startTime ? Date.now() - reply.startTime : 0;
    
    // Add response headers
    reply.header('X-Response-Time', `${responseTime}ms`);
    reply.header('X-Request-ID', request.id);
    
    // Log response
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: `${responseTime}ms`,
    }, 'Request completed');
  });

  // Validation error handler
  app.setSchemaErrorFormatter((errors, dataVar) => {
    const error = errors[0];
    return new Error(`${dataVar}${error?.instancePath} ${error?.message}`);
  });

  // Register routes
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(chartRoutes, { prefix: '/api/v1' });
  
  // TODO: Register other routes
  // await app.register(optionsRoutes, { prefix: '/api/v1' });
  // await app.register(dashboardRoutes, { prefix: '/api/v1' });

  // Swagger documentation
  if (config.featureSwaggerEnabled && config.env !== 'production') {
    await app.register(import('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'Dashboard API',
          description: 'Dynamic Dashboard REST API with chart endpoints',
          version: '1.0.0',
        },
        host: `localhost:${config.port}`,
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Charts', description: 'Dynamic chart data endpoints' },
          { name: 'Options', description: 'Options endpoints for dropdowns' },
          { name: 'Dashboard', description: 'Dashboard summary endpoints' },
        ],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    });

    await app.register(import('@fastify/swagger-ui'), {
      routePrefix: '/api/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        displayRequestDuration: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });
  }

  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info('⏳ Graceful shutdown initiated...');
    
    try {
      // Close server
      await app.close();
      
      // Disconnect from databases
      await disconnectDatabase();
      await disconnectRedis();
      
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error(error, '❌ Error during graceful shutdown');
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.fatal(error, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, 'Unhandled rejection');
    process.exit(1);
  });

  return app;
}

/**
 * Start the server
 */
export async function startServer(): Promise<FastifyInstance> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Build app
    const app = await buildApp();
    
    // Start listening
    await app.listen({
      port: config.port,
      host: config.host,
    });
    
    logger.info(`🚀 Server running at http://${config.host}:${config.port}`);
    logger.info(`📚 API Documentation at http://${config.host}:${config.port}/api/docs`);
    
    return app;
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
}

// Extend FastifyReply type to include startTime
declare module 'fastify' {
  interface FastifyReply {
    startTime?: number;
  }
}
