/**
 * Line Chart Strategy Implementation
 * Generates time-series data for line charts
 */

import { PrismaClient } from '@prisma/client';
import { BaseChartStrategy } from '../chart.strategy.js';
import type {
  ChartRequest,
  LineChartResponse,
  LineChartPoint,
  LineChartSeries,
} from '../../../types/charts.types.js';

export class LineChartStrategy extends BaseChartStrategy {
  getName(): string {
    return 'LineChartStrategy';
  }

  canHandle(params: ChartRequest): boolean {
    return params.chartType === 'line';
  }

  async execute(
    params: ChartRequest,
    prisma: PrismaClient,
  ): Promise<LineChartResponse> {
    const { start, end, metric, groupBy = 'day' } = params;

    // Build the raw SQL query for better performance
    const dateFormat = this.getDateFormat(groupBy);
    const metricAggregation = this.getMetricAggregation(metric);
    const dimensionFilters = this.buildDimensionFilters(params);

    // Create WHERE clause conditions
    const whereConditions = [`occurred_at >= ? AND occurred_at <= ?`];
    const whereParams: any[] = [
      new Date(start + 'T00:00:00.000Z'),
      new Date(end + 'T23:59:59.999Z'),
    ];

    if (dimensionFilters['categoryId']) {
      whereConditions.push('category_id = ?');
      whereParams.push(dimensionFilters['categoryId']);
    }

    if (dimensionFilters['productId']) {
      whereConditions.push('product_id = ?');
      whereParams.push(dimensionFilters['productId']);
    }

    if (dimensionFilters['customerId']) {
      whereConditions.push('customer_id = ?');
      whereParams.push(dimensionFilters['customerId']);
    }

    // Handle groupBy for different dimensions
    let query: string;

    if (['day', 'week', 'month', 'quarter', 'year'].includes(groupBy)) {
      // Time-based grouping with separate series for revenue/expense
      query = `
        SELECT 
          DATE_FORMAT(occurred_at, '${dateFormat}') as period,
          type as series_name,
          ${metricAggregation} as value
        FROM transactions
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY period, type
        ORDER BY period ASC, type ASC
      `;
    } else {
      // Dimension-based grouping (category, product, etc.)
      const dimensionTable = this.getDimensionTable(groupBy);
      const dimensionJoin = this.getDimensionJoin(groupBy);

      query = `
        SELECT 
          DATE_FORMAT(t.occurred_at, '${this.getDateFormat('day')}') as period,
          ${dimensionTable}.name as series_name,
          ${metricAggregation} as value
        FROM transactions t
        ${dimensionJoin}
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY period, series_name
        ORDER BY period ASC, series_name ASC
      `;
    }

    // Execute query
    const results = await prisma.$queryRawUnsafe<
      Array<{
        period: string;
        series_name: string;
        value: number | bigint;
      }>
    >(query, ...whereParams);

    // Transform results to line chart format
    const seriesMap = new Map<string, LineChartPoint[]>();

    results.forEach((row) => {
      const seriesName = row.series_name || 'Total';
      const point: LineChartPoint = {
        x: this.formatPeriod(row.period, groupBy),
        y: Number(row.value),
      };

      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, []);
      }
      seriesMap.get(seriesName)!.push(point);
    });

    // Fill in missing dates for continuous lines
    const series: LineChartSeries[] = [];
    let colorIndex = 0;

    for (const [name, points] of seriesMap.entries()) {
      series.push({
        name: this.formatSeriesName(name),
        points: this.fillMissingDates(points, start, end, groupBy),
        color: this.generateColor(colorIndex++),
      });
    }

    // Calculate metadata
    const allValues = results.map(r => Number(r.value));
    const metadata = {
      total: allValues.reduce((sum, val) => sum + val, 0),
      average: allValues.length > 0 
        ? allValues.reduce((sum, val) => sum + val, 0) / allValues.length 
        : 0,
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    };

    return {
      series,
      metadata,
    };
  }

  /**
   * Get dimension table name for joins
   */
  private getDimensionTable(groupBy: string): string {
    const tables: Record<string, string> = {
      category: 'c',
      product: 'p',
      customer: 'cu',
      region: 'cu',
    };
    return tables[groupBy] || 't';
  }

  /**
   * Get dimension join clause
   */
  private getDimensionJoin(groupBy: string): string {
    const joins: Record<string, string> = {
      category: 'LEFT JOIN categories c ON t.category_id = c.id',
      product: 'LEFT JOIN products p ON t.product_id = p.id',
      customer: 'LEFT JOIN customers cu ON t.customer_id = cu.id',
      region: 'LEFT JOIN customers cu ON t.customer_id = cu.id',
    };
    return joins[groupBy] || '';
  }

  /**
   * Format series name for display
   */
  private formatSeriesName(name: string): string {
    if (name === 'REVENUE') return 'Receita';
    if (name === 'EXPENSE') return 'Despesa';
    return name;
  }

  /**
   * Fill missing dates to ensure continuous lines
   */
  private fillMissingDates(
    points: LineChartPoint[],
    start: string,
    end: string,
    groupBy: string,
  ): LineChartPoint[] {
    // For non-date grouping, return as-is
    if (!['day', 'week', 'month', 'quarter', 'year'].includes(groupBy)) {
      return points;
    }

    // Create a map of existing points
    const pointMap = new Map(points.map(p => [p.x, p.y]));

    // Generate all dates in range
    const filledPoints: LineChartPoint[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = this.formatDateByGrouping(currentDate, groupBy);
      filledPoints.push({
        x: dateStr,
        y: pointMap.get(dateStr) || 0,
      });

      // Increment date based on grouping
      this.incrementDateByGrouping(currentDate, groupBy);
    }

    return filledPoints;
  }

  /**
   * Format date based on grouping
   */
  private formatDateByGrouping(date: Date, groupBy: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (groupBy) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'month':
        return `${year}-${month}-01`;
      case 'year':
        return `${year}-01-01`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Increment date based on grouping
   */
  private incrementDateByGrouping(date: Date, groupBy: string): void {
    switch (groupBy) {
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
  }
}
