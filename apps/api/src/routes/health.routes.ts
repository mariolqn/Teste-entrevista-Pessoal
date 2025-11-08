/**
 * Health check routes for monitoring
 */

import { FastifyInstance } from 'fastify';
import { checkDatabaseHealth } from '../lib/prisma';
import { checkRedisHealth } from '../lib/redis';

export async function healthRoutes(app: FastifyInstance) {
  /**
   * Basic health check
   */
  app.get('/healthz', {
    schema: {
      description: 'Basic health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  /**
   * Liveness probe - checks if the service is alive
   */
  app.get('/livez', {
    schema: {
      description: 'Liveness probe for Kubernetes',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Basic check - if the server can respond, it's alive
    return reply.status(200).send({
      status: 'alive',
    });
  });

  /**
   * Readiness probe - checks if the service is ready to receive traffic
   */
  app.get('/readyz', {
    schema: {
      description: 'Readiness probe for Kubernetes',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
              },
            },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Check all dependencies
    const [dbHealth, redisHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const services = {
      database: dbHealth ? 'connected' : 'disconnected',
      redis: redisHealth ? 'connected' : 'disconnected',
    };

    const isReady = dbHealth; // Redis is optional
    const status = isReady ? 'ready' : 'not ready';
    const statusCode = isReady ? 200 : 503;

    return reply.status(statusCode).send({
      status,
      services,
    });
  });

  /**
   * Detailed health check with metrics
   */
  app.get('/health', {
    schema: {
      description: 'Detailed health check with system metrics',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    responseTime: { type: 'number' },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    responseTime: { type: 'number' },
                  },
                },
              },
            },
            system: {
              type: 'object',
              properties: {
                memory: {
                  type: 'object',
                  properties: {
                    used: { type: 'number' },
                    total: { type: 'number' },
                    percentage: { type: 'number' },
                  },
                },
                cpu: {
                  type: 'object',
                  properties: {
                    usage: { type: 'number' },
                    count: { type: 'number' },
                  },
                },
                process: {
                  type: 'object',
                  properties: {
                    pid: { type: 'number' },
                    version: { type: 'string' },
                    uptime: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Check database health with timing
    const dbStart = Date.now();
    const dbHealth = await checkDatabaseHealth();
    const dbResponseTime = Date.now() - dbStart;

    // Check Redis health with timing
    const redisStart = Date.now();
    const redisHealth = await checkRedisHealth();
    const redisResponseTime = Date.now() - redisStart;

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const totalMemory = require('os').totalmem();
    const cpuCount = require('os').cpus().length;

    return reply.status(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: dbHealth ? 'connected' : 'disconnected',
          responseTime: dbResponseTime,
        },
        redis: {
          status: redisHealth ? 'connected' : 'disconnected',
          responseTime: redisResponseTime,
        },
      },
      system: {
        memory: {
          used: memoryUsage.heapUsed,
          total: totalMemory,
          percentage: (memoryUsage.heapUsed / totalMemory) * 100,
        },
        cpu: {
          usage: cpuUsage.user + cpuUsage.system,
          count: cpuCount,
        },
        process: {
          pid: process.pid,
          version: process.version,
          uptime: process.uptime(),
        },
      },
    });
  });
}
