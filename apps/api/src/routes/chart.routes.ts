/**
 * Chart Routes
 * Defines all chart-related API endpoints
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ChartController } from '../controllers/chart.controller.js';
import { ChartService } from '../services/charts/chart.service.js';
import prisma from '../lib/prisma.js';

/**
 * Chart routes plugin
 */
export async function chartRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  // Initialize services and controllers
  const chartService = new ChartService(prisma);
  const chartController = new ChartController(chartService);

  // Chart data endpoint
  fastify.get(
    '/charts/:chartType',
    {
      schema: {
        description: 'Get chart data dynamically based on chart type',
        tags: ['Charts'],
        params: {
          type: 'object',
          properties: {
            chartType: {
              type: 'string',
              enum: ['line', 'bar', 'pie', 'table', 'kpi'],
              description: 'Type of chart to generate',
            },
          },
          required: ['chartType'],
        },
        querystring: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date',
              description: 'Start date (ISO 8601 format)',
            },
            end: {
              type: 'string',
              format: 'date',
              description: 'End date (ISO 8601 format)',
            },
            metric: {
              type: 'string',
              enum: ['revenue', 'expense', 'profit', 'quantity', 'count'],
              default: 'revenue',
              description: 'Metric to calculate',
            },
            groupBy: {
              type: 'string',
              enum: ['day', 'week', 'month', 'quarter', 'year', 'category', 'product', 'customer', 'region'],
              description: 'Grouping dimension',
            },
            dimension: {
              type: 'string',
              description: 'Additional dimension filter',
            },
            topN: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Limit results to top N items',
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor for table data',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Page size for paginated results',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter by category ID',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter by product ID',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter by customer ID',
            },
            region: {
              type: 'string',
              description: 'Filter by region',
            },
          },
          required: ['start', 'end'],
        },
        response: {
          200: {
            description: 'Chart data in format specific to chart type',
            type: 'object',
            additionalProperties: true,
          },
          304: {
            description: 'Not Modified - client has fresh data',
            type: 'null',
          },
          400: {
            description: 'Bad Request - validation error',
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'integer' },
              detail: { type: 'string' },
              instance: { type: 'string' },
              errors: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          500: {
            description: 'Internal Server Error',
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'integer' },
              detail: { type: 'string' },
              instance: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await chartController.getChartData(request as any, reply);
    },
  );

  // Chart metadata endpoint
  fastify.get(
    '/charts/:chartType/metadata',
    {
      schema: {
        description: 'Get metadata about a specific chart type',
        tags: ['Charts'],
        params: {
          type: 'object',
          properties: {
            chartType: {
              type: 'string',
              description: 'Type of chart',
            },
          },
          required: ['chartType'],
        },
        response: {
          200: {
            description: 'Chart type metadata',
            type: 'object',
            properties: {
              name: { type: 'string' },
              supportedMetrics: {
                type: 'array',
                items: { type: 'string' },
              },
              supportedGroupBy: {
                type: 'array',
                items: { type: 'string' },
              },
              supportsPagination: { type: 'boolean' },
            },
          },
          404: {
            description: 'Chart type not found',
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'integer' },
              detail: { type: 'string' },
              instance: { type: 'string' },
              validTypes: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await chartController.getChartMetadata(request as any, reply);
    },
  );

  // Available chart types endpoint
  fastify.get(
    '/charts/types',
    {
      schema: {
        description: 'Get all available chart types with metadata',
        tags: ['Charts'],
        response: {
          200: {
            description: 'Available chart types',
            type: 'object',
            properties: {
              types: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    label: { type: 'string' },
                    metadata: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        supportedMetrics: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                        supportedGroupBy: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                        supportsPagination: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await chartController.getChartTypes(request, reply);
    },
  );

  // Register OpenAPI documentation for these routes
  fastify.log.info('Chart routes registered');
}
