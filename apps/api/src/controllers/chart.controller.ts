/**
 * Chart Controller
 * Handles HTTP requests for chart data endpoints
 */

import crypto from 'node:crypto';

import { z } from 'zod';

import {
  chartParamsSchema,
  chartQuerySchema,
  type ChartParams,
  type ChartQuery,
} from '../types/charts.types.js';
import { logger } from '../utils/logger.js';

import type { ChartService } from '../services/charts/chart.service.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export class ChartController {
  constructor(private chartService: ChartService) {}

  /**
   * Get chart data endpoint handler
   * GET /api/v1/charts/:chartType
   */
  async getChartData(
    request: FastifyRequest<{
      Params: ChartParams;
      Querystring: ChartQuery;
    }>,
    reply: FastifyReply,
  ) {
    const requestId = request.id;
    const startTime = Date.now();

    try {
      // Validate params and query
      const params = chartParamsSchema.parse(request.params);
      const query = chartQuerySchema.parse(request.query);

      // Log request
      logger.info(
        {
          requestId,
          chartType: params.chartType,
          dateRange: { start: query.start, end: query.end },
          metric: query.metric,
        },
        'Chart request received',
      );

      // Combine params and query for the service
      const chartRequest = { ...params, ...query };

      // Validate parameters
      const validationErrors = this.chartService.validateParams(chartRequest);
      if (validationErrors.length > 0) {
        return this.sendValidationError(reply, validationErrors, request.url);
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(chartRequest);
      const etag = this.generateETag(cacheKey);

      // Check if client has fresh copy
      if (request.headers['if-none-match'] === etag) {
        logger.info({ requestId, cacheKey }, 'Client has fresh data (304)');
        return reply.status(304).send();
      }

      // Fetch chart data
      const data = await this.chartService.getChartData(chartRequest);

      // Set cache headers
      const cacheControl = this.getCacheControl(params.chartType);

      // Send response with appropriate headers
      const duration = Date.now() - startTime;
      logger.info(
        {
          requestId,
          duration,
          dataSize: JSON.stringify(data).length,
        },
        'Chart data sent successfully',
      );

      return reply
        .header('ETag', etag)
        .header('Cache-Control', cacheControl)
        .header('X-Response-Time', `${duration}ms`)
        .send(data);
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return this.sendValidationError(
          reply,
          error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
          request.url,
        );
      }

      // Log error
      logger.error(
        {
          requestId,
          error,
          duration: Date.now() - startTime,
        },
        'Error processing chart request',
      );

      // Handle other errors
      return this.sendServerError(reply, error, request.url);
    }
  }

  /**
   * Get chart metadata endpoint handler
   * GET /api/v1/charts/:chartType/metadata
   */
  async getChartMetadata(
    request: FastifyRequest<{
      Params: { chartType: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { chartType } = request.params;

      // Validate chart type
      const validTypes = this.chartService.getAvailableChartTypes();
      if (!validTypes.includes(chartType as any)) {
        return reply.status(404).send({
          type: 'https://api.dashboard.com/errors/not-found',
          title: 'Chart Type Not Found',
          status: 404,
          detail: `Chart type '${chartType}' is not supported`,
          instance: request.url,
          validTypes,
        });
      }

      // Get metadata
      const metadata = this.chartService.getStrategyMetadata(chartType as any);

      return reply.header('Cache-Control', 'public, max-age=3600').send(metadata);
    } catch (error) {
      logger.error({ error }, 'Error getting chart metadata');
      return this.sendServerError(reply, error, request.url);
    }
  }

  /**
   * Get available chart types endpoint handler
   * GET /api/v1/charts/types
   */
  async getChartTypes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const types = this.chartService.getAvailableChartTypes();

      const response = types.map((type) => ({
        value: type,
        label: this.getChartTypeLabel(type),
        metadata: this.chartService.getStrategyMetadata(type),
      }));

      return reply.header('Cache-Control', 'public, max-age=3600').send({ types: response });
    } catch (error) {
      logger.error({ error }, 'Error getting chart types');
      return this.sendServerError(reply, error, request.url);
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(params: any): string {
    // Create a stable string representation of parameters
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: any, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {});

    return `chart:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Generate ETag for response
   */
  private generateETag(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Get cache control header based on chart type
   */
  private getCacheControl(chartType: string): string {
    // Different cache strategies for different chart types
    switch (chartType) {
      case 'kpi': {
        return 'private, max-age=30';
      } // KPIs refresh more frequently
      case 'table': {
        return 'private, max-age=60';
      } // Tables moderate caching
      default: {
        return 'private, max-age=120';
      } // Charts can be cached longer
    }
  }

  /**
   * Get human-readable label for chart type
   */
  private getChartTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      line: 'Gráfico de Linhas',
      bar: 'Gráfico de Barras',
      pie: 'Gráfico de Pizza',
      table: 'Tabela',
      kpi: 'Indicadores (KPI)',
    };
    return labels[type] || type;
  }

  /**
   * Send validation error response
   */
  private sendValidationError(reply: FastifyReply, errors: string[], instance: string) {
    return reply.status(400).send({
      type: 'https://api.dashboard.com/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: errors.join('; '),
      instance,
      errors,
    });
  }

  /**
   * Send server error response
   */
  private sendServerError(reply: FastifyReply, error: any, instance: string) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return reply.status(500).send({
      type: 'https://api.dashboard.com/errors/internal',
      title: 'Internal Server Error',
      status: 500,
      detail: message,
      instance,
    });
  }
}
