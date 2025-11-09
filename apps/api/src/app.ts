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
import { optionsRoutes } from './routes/options.routes';
import { dashboardRoutes } from './routes/dashboard.routes';

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

  // Register shared schemas for OpenAPI
  registerGlobalSchemas(app);

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

  // Swagger / OpenAPI documentation
  const shouldRegisterSwagger =
    config.featureSwaggerEnabled || process.env['SWAGGER_GENERATE'] === 'true';

  if (shouldRegisterSwagger) {
    const swaggerPlugin = await import('@fastify/swagger');
    await app.register(swaggerPlugin.default ?? (swaggerPlugin as any), {
      openapi: {
        info: {
          title: 'Dynamic Dashboard API',
          description:
            'REST API powering the financial dashboard with dynamic chart data, KPI summaries, and cursor-based option lists.',
          version: '1.0.0',
          contact: {
            name: 'Dashboard Platform Team',
            email: 'engineering@example.com',
          },
        },
        servers: [
          {
            url: `http://${config.host}:${config.port}${config.apiPrefix}`,
            description: 'Local development',
          },
        ],
        tags: [
          { name: 'Health', description: 'Service health and readiness' },
          { name: 'Charts', description: 'Dynamic chart data endpoints' },
          { name: 'Options', description: 'Option lists for selectors' },
          { name: 'Dashboard', description: 'Dashboard KPI summaries' },
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description:
                'Provide a valid JWT access token using the `Authorization: Bearer <token>` header.',
            },
          },
        },
      },
      hideUntagged: true,
    });

    const swaggerUi = await import('@fastify/swagger-ui');
    await app.register(swaggerUi.default ?? (swaggerUi as any), {
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

  // Register routes
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(chartRoutes, { prefix: '/api/v1' });
  await app.register(optionsRoutes, { prefix: '/api/v1' });
  await app.register(dashboardRoutes, { prefix: '/api/v1' });

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

/**
 * Register global reusable schemas for OpenAPI generation.
 */
function registerGlobalSchemas(app: FastifyInstance) {
  app.addSchema({
    $id: 'ProblemDetails',
    type: 'object',
    additionalProperties: false,
    required: ['type', 'title', 'status', 'detail', 'instance'],
    properties: {
      type: { type: 'string', format: 'uri' },
      title: { type: 'string' },
      status: { type: 'integer', minimum: 100, maximum: 599 },
      detail: { type: 'string' },
      instance: { type: 'string' },
      errors: {
        type: 'object',
        additionalProperties: true,
      },
    },
  });

  app.addSchema({
    $id: 'LineChartResponse',
    type: 'object',
    required: ['series'],
    properties: {
      series: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'points'],
          properties: {
            name: { type: 'string' },
            color: { type: 'string' },
            points: {
              type: 'array',
              items: {
                type: 'object',
                required: ['x', 'y'],
                properties: {
                  x: { type: 'string' },
                  y: { type: 'number' },
                },
              },
            },
          },
        },
      },
      metadata: {
        type: 'object',
        nullable: true,
        additionalProperties: false,
        properties: {
          total: { type: 'number' },
          average: { type: 'number' },
          min: { type: 'number' },
          max: { type: 'number' },
        },
      },
    },
  });

  app.addSchema({
    $id: 'PieChartResponse',
    type: 'object',
    required: ['series'],
    properties: {
      series: {
        type: 'array',
        items: {
          type: 'object',
          required: ['label', 'value', 'percentage'],
          properties: {
            label: { type: 'string' },
            value: { type: 'number' },
            percentage: { type: 'number' },
            color: { type: 'string' },
          },
        },
      },
      metadata: {
        type: 'object',
        nullable: true,
        additionalProperties: false,
        properties: {
          total: { type: 'number' },
        },
      },
    },
  });

  app.addSchema({
    $id: 'BarChartResponse',
    type: 'object',
    required: ['categories', 'series'],
    properties: {
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      series: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'data'],
          properties: {
            name: { type: 'string' },
            color: { type: 'string' },
            data: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        },
      },
      metadata: {
        type: 'object',
        nullable: true,
        additionalProperties: false,
        properties: {
          total: { type: 'number' },
          average: { type: 'number' },
        },
      },
    },
  });

  app.addSchema({
    $id: 'TableChartResponse',
    type: 'object',
    required: ['columns', 'rows'],
    properties: {
      columns: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'label', 'type'],
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            type: {
              type: 'string',
              enum: ['string', 'number', 'date', 'currency', 'percentage'],
            },
            sortable: { type: 'boolean' },
            align: { type: 'string', enum: ['left', 'center', 'right'] },
          },
        },
      },
      rows: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'null' },
            ],
          },
        },
      },
      cursor: { type: 'string', nullable: true },
      hasMore: { type: 'boolean', nullable: true },
      total: { type: 'integer', nullable: true },
    },
  });

  app.addSchema({
    $id: 'KPIChartResponse',
    type: 'object',
    required: ['metrics', 'period'],
    properties: {
      metrics: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          required: ['current', 'trend'],
          properties: {
            current: { type: 'number' },
            previous: { type: 'number', nullable: true },
            change: { type: 'number', nullable: true },
            changePercentage: { type: 'number', nullable: true },
            trend: { type: 'string', enum: ['up', 'down', 'stable'] },
          },
        },
      },
      period: {
        type: 'object',
        required: ['current'],
        properties: {
          current: {
            type: 'object',
            required: ['start', 'end'],
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
            },
          },
          previous: {
            type: 'object',
            nullable: true,
            required: ['start', 'end'],
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
            },
          },
        },
      },
    },
  });

  app.addSchema({
    $id: 'OptionsItem',
    type: 'object',
    required: ['id', 'label', 'value'],
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      value: { type: 'string' },
      metadata: { type: 'object', additionalProperties: true, nullable: true },
    },
  });

  app.addSchema({
    $id: 'OptionsResponse',
    type: 'object',
    required: ['items', 'hasMore', 'total'],
    properties: {
      items: {
        type: 'array',
        items: { $ref: 'OptionsItem#' },
      },
      nextCursor: { type: 'string', nullable: true },
      hasMore: { type: 'boolean' },
      total: { type: 'integer' },
    },
  });

  app.addSchema({
    $id: 'DashboardSummaryResponse',
    type: 'object',
    required: [
      'totalRevenue',
      'totalExpense',
      'liquidProfit',
      'overdueAccounts',
      'upcomingAccounts',
      'metadata',
    ],
    properties: {
      totalRevenue: { type: 'number' },
      totalExpense: { type: 'number' },
      liquidProfit: { type: 'number' },
      overdueAccounts: {
        type: 'object',
        required: ['receivable', 'payable', 'total'],
        properties: {
          receivable: { type: 'number' },
          payable: { type: 'number' },
          total: { type: 'number' },
        },
      },
      upcomingAccounts: {
        type: 'object',
        required: ['receivable', 'payable', 'total'],
        properties: {
          receivable: { type: 'number' },
          payable: { type: 'number' },
          total: { type: 'number' },
        },
      },
      metadata: {
        type: 'object',
        required: ['period', 'generatedAt'],
        properties: {
          period: {
            type: 'object',
            required: ['start', 'end'],
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
            },
          },
          generatedAt: { type: 'string' },
        },
      },
    },
  });
}
