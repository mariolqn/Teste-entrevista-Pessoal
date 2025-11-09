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
        tags: ['Charts'],
        summary: 'Fetch chart data',
        description: 'Retrieve chart-ready data for the requested chart type, respecting the provided date range and filters.',
        operationId: 'getChartData',
        security: [],
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
              description: 'Inclusive start date (YYYY-MM-DD or ISO 8601).',
              examples: ['2024-01-01'],
            },
            end: {
              type: 'string',
              format: 'date',
              description: 'Inclusive end date (YYYY-MM-DD or ISO 8601).',
              examples: ['2024-01-31'],
            },
            metric: {
              type: 'string',
              enum: ['revenue', 'expense', 'profit', 'quantity', 'count'],
              default: 'revenue',
              description: 'Metric to calculate in the chart series.',
            },
            groupBy: {
              type: 'string',
              enum: ['day', 'week', 'month', 'quarter', 'year', 'category', 'product', 'customer', 'region'],
              description: 'Primary grouping dimension for aggregations.',
            },
            dimension: {
              type: 'string',
              description: 'Additional dimension to filter or annotate the result set.',
            },
            topN: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Restrict the result set to the top N elements by value (pie/bar charts).',
            },
            cursor: {
              type: 'string',
              description: 'Opaque pagination cursor for table responses.',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Number of rows to return for table responses.',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter results to a specific category.',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter results to a specific product.',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter results to a specific customer.',
            },
            region: {
              type: 'string',
              description: 'Filter results to a specific customer region.',
            },
          },
          required: ['start', 'end'],
        },
        response: {
          200: {
            description: 'Chart payload for the requested type.',
            oneOf: [
              { $ref: 'LineChartResponse#' },
              { $ref: 'BarChartResponse#' },
              { $ref: 'PieChartResponse#' },
              { $ref: 'TableChartResponse#' },
              { $ref: 'KPIChartResponse#' },
            ],
            examples: [
              {
                summary: 'Line chart example',
                value: {
                  series: [
                    {
                      name: 'Revenue',
                      points: [
                        { x: '2024-01-01', y: 8250.42 },
                        { x: '2024-01-02', y: 6120.1 },
                      ],
                    },
                    {
                      name: 'Expense',
                      points: [
                        { x: '2024-01-01', y: 4500.0 },
                        { x: '2024-01-02', y: 9820.75 },
                      ],
                    },
                  ],
                },
              },
              {
                summary: 'Pie chart example',
                value: {
                  series: [
                    { label: 'Category A', value: 41954.26, percentage: 55.3 },
                    { label: 'Category B', value: 3390.12, percentage: 4.47 },
                    { label: 'Others', value: 3050.0, percentage: 4.03 },
                  ],
                },
              },
            ],
          },
          304: {
            description: 'Not Modified - client has fresh data',
            type: 'null',
          },
          400: {
            description: 'Validation error',
            $ref: 'ProblemDetails#',
          },
          500: {
            description: 'Unexpected server error',
            $ref: 'ProblemDetails#',
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
        summary: 'Get chart metadata',
        description: 'Retrieve useful metadata about a chart strategy, including supported metrics and grouping dimensions.',
        operationId: 'getChartMetadata',
        security: [],
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
            $ref: 'ProblemDetails#',
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
        summary: 'List available charts',
        description: 'List every chart type supported by the API alongside helper metadata for building UI selectors.',
        operationId: 'listChartTypes',
        security: [],
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
          500: {
            description: 'Unexpected server error',
            $ref: 'ProblemDetails#',
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
