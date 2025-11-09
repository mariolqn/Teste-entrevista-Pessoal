/**
 * Options Routes
 * Provides cursor-based option endpoints for dropdowns and autocomplete
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import prisma from '../lib/prisma.js';
import { OptionsService } from '../services/options/options.service.js';
import { OptionsController } from '../controllers/options.controller.js';

export async function optionsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  const optionsService = new OptionsService(prisma);
  const optionsController = new OptionsController(optionsService);

  fastify.get(
    '/options/:entity',
    {
      schema: {
        description: 'Retrieve options for dropdowns with cursor-based pagination',
        summary: 'Get options',
        operationId: 'listOptions',
        tags: ['Options'],
        security: [],
        params: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              enum: ['categories', 'products', 'customers', 'regions'],
              description: 'Entity to fetch options for',
            },
          },
          required: ['entity'],
        },
        querystring: {
          type: 'object',
          properties: {
            q: {
              type: 'string',
              description: 'Search term (fuzzy match)',
              minLength: 1,
              maxLength: 100,
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Maximum number of items to return',
            },
            cursor: {
              type: 'string',
              description: 'Opaque cursor for fetching the next page',
            },
            includeInactive: {
              type: 'boolean',
              description: 'Include inactive records in results',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              description: 'Filter products by category',
            },
            region: {
              type: 'string',
              description: 'Filter customers by region',
            },
          },
        },
        response: {
          200: {
            description: 'Options response',
            $ref: 'OptionsResponse#',
            examples: [
              {
                summary: 'Paginated option list',
                value: {
                  items: [
                    {
                      id: 'e8f1f2d1-6f9d-4e64-9ac9-7cb6f9d0d942',
                      label: 'Suzano Transporte Florestal',
                      value: 'e8f1f2d1-6f9d-4e64-9ac9-7cb6f9d0d942',
                    },
                    {
                      id: 'c2a3f5e0-7d88-4f78-8c19-43ab47f1f9b7',
                      label: 'Transporte de Agregados Itabira MG',
                      value: 'c2a3f5e0-7d88-4f78-8c19-43ab47f1f9b7',
                    },
                  ],
                  nextCursor: 'eyJpZCI6ImMyYTNmNWUwLTdkODgtNGY3OC04YzE5LTQzYWI0N2YxZjliNyJ9',
                  hasMore: true,
                  total: 42,
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
      await optionsController.getOptions(request as any, reply);
    },
  );

  fastify.log.info('Options routes registered');
}

