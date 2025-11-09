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
        tags: ['Options'],
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
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    label: { type: 'string' },
                    value: { type: 'string' },
                    metadata: { type: 'object', additionalProperties: true },
                  },
                },
              },
              nextCursor: {
                type: 'string',
                nullable: true,
                description: 'Cursor for the next page, if available',
              },
              hasMore: {
                type: 'boolean',
              },
              total: {
                type: 'integer',
                description: 'Total number of available items matching the filter',
              },
            },
          },
          400: {
            description: 'Validation error',
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'integer' },
              detail: { type: 'string' },
              errors: { type: 'object', additionalProperties: true },
            },
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

