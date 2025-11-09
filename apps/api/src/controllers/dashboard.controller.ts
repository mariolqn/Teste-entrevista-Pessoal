/**
 * Dashboard Controller
 * Handles KPI summary endpoints.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DashboardService } from '../services/dashboard/dashboard.service.js';
import {
  dashboardSummaryQuerySchema,
  type DashboardSummaryQuery,
} from '../types/dashboard.types.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/v1/dashboard/summary
   */
  async getSummary(
    request: FastifyRequest<{ Querystring: DashboardSummaryQuery }>,
    reply: FastifyReply,
  ) {
    const requestId = request.id;
    const startedAt = Date.now();

    try {
      const query = dashboardSummaryQuerySchema.parse(request.query);

      logger.info(
        {
          requestId,
          start: query.start,
          end: query.end,
          categoryId: query.categoryId,
          productId: query.productId,
          customerId: query.customerId,
          region: query.region,
        },
        'Dashboard summary request received',
      );

      const summaryParams = {
        start: this.parseDate(query.start),
        end: this.parseDate(query.end),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.region ? { region: query.region } : {}),
      };

      const summary = await this.dashboardService.getSummary(summaryParams);

      logger.info(
        {
          requestId,
          duration: `${Date.now() - startedAt}ms`,
        },
        'Dashboard summary computed',
      );

      const cacheControl = this.dashboardService.getCacheControlHeader();

      return reply.header('Cache-Control', cacheControl).send(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const detail = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
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
        },
        'Dashboard summary computation failed',
      );

      throw error;
    }
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) {
      throw new ValidationError(`Invalid date provided: ${value}`);
    }
    return parsed;
  }
}

