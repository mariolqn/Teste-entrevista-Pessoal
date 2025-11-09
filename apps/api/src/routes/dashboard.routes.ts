/**
 * Dashboard routes
 * Provides KPI summary data for dashboard cards.
 */

import { DashboardController } from '../controllers/dashboard.controller.js';
import prisma from '../lib/prisma.js';
import { DashboardService } from '../services/dashboard/dashboard.service.js';

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function dashboardRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  const dashboardService = new DashboardService(prisma);
  const dashboardController = new DashboardController(dashboardService);

  fastify.get(
    '/dashboard/summary',
    {
      schema: {
        description: 'Get aggregated KPI summary for the dashboard',
        summary: 'Dashboard KPI summary',
        operationId: 'getDashboardSummary',
        tags: ['Dashboard'],
        security: [],
        querystring: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date',
              description: 'Start of the period (ISO 8601)',
            },
            end: {
              type: 'string',
              format: 'date',
              description: 'End of the period (ISO 8601)',
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
              description: 'Filter by customer region',
            },
          },
          required: ['start', 'end'],
        },
        response: {
          200: {
            description: 'Dashboard summary response',
            $ref: 'DashboardSummaryResponse#',
            examples: [
              {
                summary: 'Summary for April 2024',
                value: {
                  totalRevenue: 41_954.26,
                  totalExpense: 67_740.79,
                  liquidProfit: -25_786.53,
                  overdueAccounts: {
                    receivable: 7500,
                    payable: 34_853,
                    total: 42_353,
                  },
                  upcomingAccounts: {
                    receivable: 0,
                    payable: 0,
                    total: 0,
                  },
                  metadata: {
                    period: {
                      start: '2024-04-01',
                      end: '2024-04-30',
                    },
                    generatedAt: '2024-05-01T12:00:00.000Z',
                  },
                },
              },
            ],
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
      await dashboardController.getSummary(request as any, reply);
    },
  );

  fastify.log.info('Dashboard routes registered');
}
