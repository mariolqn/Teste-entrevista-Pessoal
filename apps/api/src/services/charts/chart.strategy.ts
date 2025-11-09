/**
 * Chart Strategy Interface
 * Defines the contract for all chart strategy implementations
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type {
  ChartRequest,
  ChartResponse,
} from '../../types/charts.types.js';

export interface ChartStrategy {
  /**
   * Execute the strategy to generate chart data
   * @param params - The chart request parameters
   * @param prisma - Prisma client instance
   * @returns Promise with the chart response data
   */
  execute(
    params: ChartRequest,
    prisma: PrismaClient,
  ): Promise<ChartResponse>;

  /**
   * Validate if this strategy can handle the given parameters
   * @param params - The chart request parameters
   * @returns Boolean indicating if strategy is applicable
   */
  canHandle(params: ChartRequest): boolean;

  /**
   * Get the strategy name for logging/debugging
   */
  getName(): string;
}

/**
 * Base abstract class for chart strategies
 * Provides common functionality for all chart types
 */
export abstract class BaseChartStrategy implements ChartStrategy {
  abstract execute(
    params: ChartRequest,
    prisma: PrismaClient,
  ): Promise<ChartResponse>;

  abstract canHandle(params: ChartRequest): boolean;

  abstract getName(): string;

  /**
   * Build date filter for Prisma queries
   */
  protected buildDateFilter(start: string, end: string): Prisma.DateTimeFilter {
    return {
      gte: new Date(start + 'T00:00:00.000Z'),
      lte: new Date(end + 'T23:59:59.999Z'),
    };
  }

  /**
   * Build dimension filters based on parameters
   */
  protected buildDimensionFilters(params: ChartRequest): Record<string, any> {
    const filters: Record<string, any> = {};

    if (params.categoryId) {
      filters['categoryId'] = params.categoryId;
    }

    if (params.productId) {
      filters['productId'] = params.productId;
    }

    if (params.customerId) {
      filters['customerId'] = params.customerId;
    }

    if (params.region) {
      filters['customer'] = {
        region: params.region,
      };
    }

    return filters;
  }

  /**
   * Get SQL aggregation function based on metric
   */
  protected getMetricAggregation(metric: string): string {
    const aggregations = {
      revenue: "SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END)",
      expense: "SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)",
      profit: "SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE -amount END)",
      quantity: 'SUM(quantity)',
      count: 'COUNT(*)',
    } satisfies Record<string, string>;

    const key = metric as keyof typeof aggregations;
    return aggregations[key] ?? aggregations.revenue;
  }

  /**
   * Get SQL date format based on groupBy parameter
   */
  protected getDateFormat(groupBy: string): string {
    const formats = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m',
      quarter: "CONCAT(YEAR(occurred_at), '-Q', QUARTER(occurred_at))",
      year: '%Y',
    } satisfies Record<string, string>;

    const key = groupBy as keyof typeof formats;
    return formats[key] ?? formats.day;
  }

  /**
   * Format period for display
   */
  protected formatPeriod(period: string, groupBy: string): string {
    if (groupBy === 'day') return period;
    if (groupBy === 'month') return `${period}-01`;
    if (groupBy === 'year') return `${period}-01-01`;
    // Handle week and quarter formatting as needed
    return period;
  }

  /**
   * Calculate percentage from value and total
   */
  protected calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 10000) / 100; // Round to 2 decimal places
  }

  /**
   * Apply topN limit to results if specified
   */
  protected applyTopN<T extends { value: number }>(
    items: T[],
    topN?: number,
  ): T[] {
    if (!topN || topN >= items.length) return items;

    // Sort by value descending and take topN
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, topN);
    const others = sorted.slice(topN);

    if (others.length > 0) {
      const othersSum = others.reduce((sum, item) => sum + item.value, 0);
      // Add "Others" category
      top.push({
        ...others[0],
        label: 'Others',
        value: othersSum,
      } as unknown as T);
    }

    return top;
  }

  /**
   * Generate a color for chart elements
   */
  protected generateColor(index: number): string {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
      '#6366F1', // indigo
      '#84CC16', // lime
    ];

    const selected = colors[index % colors.length];
    return selected ?? '#3B82F6';
  }

  /**
   * Parse cursor for pagination
   */
  protected parseCursor(cursor?: string): any {
    if (!cursor) return null;

    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      return null;
    }
  }

  /**
   * Encode cursor for pagination
   */
  protected encodeCursor(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }
}
