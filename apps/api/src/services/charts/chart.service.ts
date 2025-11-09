/**
 * Chart Service
 * Orchestrates chart strategies to generate dynamic chart data
 */

import { PrismaClient } from '@prisma/client';
import type {
  ChartRequest,
  ChartResponse,
  ChartTypeEnum,
} from '../../types/charts.types.js';
import { ChartStrategy } from './chart.strategy.js';
import { cacheService } from '../../lib/redis.js';
import { config } from '../../config/index.js';
import { LineChartStrategy } from './strategies/line-chart.strategy.js';
import { PieChartStrategy } from './strategies/pie-chart.strategy.js';
import { BarChartStrategy } from './strategies/bar-chart.strategy.js';
import { TableChartStrategy } from './strategies/table-chart.strategy.js';
import { KPIChartStrategy } from './strategies/kpi-chart.strategy.js';
import { logger } from '../../utils/logger.js';

export class ChartService {
  private strategies: Map<ChartTypeEnum, ChartStrategy>;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize all chart strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('line', new LineChartStrategy());
    this.strategies.set('pie', new PieChartStrategy());
    this.strategies.set('bar', new BarChartStrategy());
    this.strategies.set('table', new TableChartStrategy());
    this.strategies.set('kpi', new KPIChartStrategy());
  }

  /**
   * Get chart data using the appropriate strategy
   */
  async getChartData(params: ChartRequest): Promise<ChartResponse> {
    const startTime = Date.now();
    const { chartType } = params;

    logger.info({ chartType, params }, 'Generating chart data');

    // Get the appropriate strategy
    const strategy = this.strategies.get(chartType);

    if (!strategy) {
      logger.error({ chartType }, 'Unsupported chart type');
      throw new Error(`Unsupported chart type: ${chartType}`);
    }

    // Validate strategy can handle the request
    if (!strategy.canHandle(params)) {
      logger.error({ chartType, params }, 'Strategy cannot handle request');
      throw new Error(`Strategy ${strategy.getName()} cannot handle request`);
    }

    const cacheKey = this.buildCacheKey(params);

    if (config.featureCacheEnabled) {
      const cached = await cacheService.get<ChartResponse>(cacheKey);
      if (cached) {
        logger.debug({ chartType, cacheKey }, 'Chart cache hit');
        return cached;
      }

      logger.debug({ chartType, cacheKey }, 'Chart cache miss');
    }

    try {
      // Execute strategy
      const result = await strategy.execute(params, this.prisma);

      // Log performance metrics
      const duration = Date.now() - startTime;
      logger.info(
        { 
          chartType, 
          duration, 
          resultSize: JSON.stringify(result).length,
        },
        'Chart data generated successfully',
      );

      if (config.featureCacheEnabled) {
        const ttl = this.getCacheTtl(chartType);
        await cacheService.set(cacheKey, result, ttl);
        logger.debug({ chartType, cacheKey, ttl }, 'Chart cache populated');
      }

      return result;
    } catch (error) {
      logger.error(
        { 
          error, 
          chartType, 
          params,
        },
        'Error generating chart data',
      );
      throw error;
    }
  }

  /**
   * Validate chart parameters
   */
  validateParams(params: ChartRequest): string[] {
    const errors: string[] = [];

    // Validate date range
    const startDate = new Date(params.start);
    const endDate = new Date(params.end);

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date');
    }

    if (startDate > endDate) {
      errors.push('Start date must be before or equal to end date');
    }

    // Validate date range is not too large (e.g., max 1 year)
    const maxRangeDays = 365;
    const rangeDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (rangeDays > maxRangeDays) {
      errors.push(`Date range cannot exceed ${maxRangeDays} days`);
    }

    // Validate chart-specific parameters
    switch (params.chartType) {
      case 'line':
        if (params.groupBy && !['day', 'week', 'month', 'quarter', 'year', 'category', 'product'].includes(params.groupBy)) {
          errors.push('Invalid groupBy value for line chart');
        }
        break;

      case 'pie':
        if (params.topN && params.topN > 20) {
          errors.push('topN cannot exceed 20 for pie charts');
        }
        break;

      case 'bar':
        if (params.topN && params.topN > 50) {
          errors.push('topN cannot exceed 50 for bar charts');
        }
        break;

      case 'table':
        if (params.limit && params.limit > 100) {
          errors.push('Limit cannot exceed 100 for table data');
        }
        break;
    }

    return errors;
  }

  /**
   * Get available chart types
   */
  getAvailableChartTypes(): ChartTypeEnum[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get strategy metadata
   */
  getStrategyMetadata(chartType: ChartTypeEnum): {
    name: string;
    supportedMetrics: string[];
    supportedGroupBy: string[];
    supportsPagination: boolean;
  } {
    const strategy = this.strategies.get(chartType);

    if (!strategy) {
      throw new Error(`Unknown chart type: ${chartType}`);
    }

    // Return metadata based on chart type
    switch (chartType) {
      case 'line':
        return {
          name: 'Line Chart',
          supportedMetrics: ['revenue', 'expense', 'profit', 'quantity', 'count'],
          supportedGroupBy: ['day', 'week', 'month', 'quarter', 'year', 'category', 'product'],
          supportsPagination: false,
        };

      case 'pie':
        return {
          name: 'Pie Chart',
          supportedMetrics: ['revenue', 'expense', 'profit', 'quantity', 'count'],
          supportedGroupBy: ['category', 'product', 'customer', 'region', 'type', 'status'],
          supportsPagination: false,
        };

      case 'bar':
        return {
          name: 'Bar Chart',
          supportedMetrics: ['revenue', 'expense', 'profit', 'quantity', 'count'],
          supportedGroupBy: ['category', 'product', 'customer', 'region', 'month', 'quarter', 'year'],
          supportsPagination: false,
        };

      case 'table':
        return {
          name: 'Table',
          supportedMetrics: ['revenue', 'expense', 'profit', 'quantity', 'count'],
          supportedGroupBy: ['transactions', 'category', 'product', 'customer'],
          supportsPagination: true,
        };

      case 'kpi':
        return {
          name: 'KPI',
          supportedMetrics: ['all'],
          supportedGroupBy: [],
          supportsPagination: false,
        };

      default:
        return {
          name: chartType,
          supportedMetrics: [],
          supportedGroupBy: [],
          supportsPagination: false,
        };
    }
  }

  private buildCacheKey(params: ChartRequest): string {
    const sortedEntries = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    const serialized = sortedEntries.map(([key, value]) => `${key}:${value}`).join('|');
    return `chart:${params.chartType}:${serialized}`;
  }

  private getCacheTtl(chartType: ChartTypeEnum): number {
    if (chartType === 'kpi') {
      return Math.min(30, config.redisTtl);
    }

    if (chartType === 'table') {
      return Math.min(60, config.redisTtl);
    }

    return config.redisTtl;
  }
}
