/**
 * Options Controller
 * Handles HTTP requests for options endpoints with cursor pagination
 */

import { z } from 'zod';

import {
  type OptionsParams,
  type OptionsQuery,
  optionsParamsSchema,
  optionsQuerySchema,
} from '../types/options.types.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

import type { OptionsService } from '../services/options/options.service.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  /**
   * GET /api/v1/options/:entity
   */
  async getOptions(
    request: FastifyRequest<{
      Params: OptionsParams;
      Querystring: OptionsQuery;
    }>,
    reply: FastifyReply,
  ) {
    const requestId = request.id;
    const startTime = Date.now();

    try {
      const params = optionsParamsSchema.parse(request.params);
      const query = optionsQuerySchema.parse(request.query);

      logger.info(
        {
          requestId,
          entity: params.entity,
          q: query.q,
          limit: query.limit,
        },
        'Options request received',
      );

      const result = await this.optionsService.getOptions(params.entity, query);

      logger.info(
        {
          requestId,
          entity: params.entity,
          count: result.items.length,
          duration: `${Date.now() - startTime}ms`,
        },
        'Options response generated',
      );

      return reply.header('Cache-Control', 'private, max-age=30').send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const detail = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        throw new ValidationError(detail, {
          validation: error.flatten(),
        });
      }

      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error(
        {
          requestId,
          error,
          duration: `${Date.now() - startTime}ms`,
        },
        'Error handling options request',
      );

      throw error;
    }
  }
}
