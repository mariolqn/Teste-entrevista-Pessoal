/**
 * Pie Chart Strategy Implementation
 * Generates categorical distribution data for pie charts
 */

import { BaseChartStrategy } from '../chart.strategy.js';

import type { ChartRequest, PieChartResponse, PieChartSlice } from '../../../types/charts.types.js';
import type { PrismaClient } from '@prisma/client';

export class PieChartStrategy extends BaseChartStrategy {
  getName(): string {
    return 'PieChartStrategy';
  }

  canHandle(params: ChartRequest): boolean {
    return params.chartType === 'pie';
  }

  async execute(params: ChartRequest, prisma: PrismaClient): Promise<PieChartResponse> {
    const { start, end, metric, dimension = 'category', topN } = params;

    // Determine what to group by
    const groupByField = this.getGroupByField(dimension);
    const joinClause = this.getJoinClause(dimension);
    const labelField = this.getLabelField(dimension);

    // Build the query
    const metricAggregation = this.getMetricAggregation(metric);
    const dimensionFilters = this.buildDimensionFilters(params);

    // Create WHERE clause conditions
    const whereConditions = [`t.occurred_at >= ? AND t.occurred_at <= ?`];
    const whereParams: any[] = [
      new Date(`${start}T00:00:00.000Z`),
      new Date(`${end}T23:59:59.999Z`),
    ];

    if (dimensionFilters['categoryId']) {
      whereConditions.push('t.category_id = ?');
      whereParams.push(dimensionFilters['categoryId']);
    }

    if (dimensionFilters['productId']) {
      whereConditions.push('t.product_id = ?');
      whereParams.push(dimensionFilters['productId']);
    }

    if (dimensionFilters['customerId']) {
      whereConditions.push('t.customer_id = ?');
      whereParams.push(dimensionFilters['customerId']);
    }

    // Build and execute query
    const query = `
      SELECT 
        ${labelField} as label,
        ${groupByField} as group_id,
        ${metricAggregation} as value
      FROM transactions t
      ${joinClause}
      WHERE ${whereConditions.join(' AND ')}
        AND ${groupByField} IS NOT NULL
      GROUP BY ${groupByField}, ${labelField}
      ORDER BY value DESC
    `;

    const results = await prisma.$queryRawUnsafe<
      {
        label: string;
        group_id: string;
        value: number | bigint;
      }[]
    >(query, ...whereParams);

    // Convert bigint to number and calculate total
    const processedResults = results.map((r) => ({
      ...r,
      value: Number(r.value),
    }));

    const total = processedResults.reduce((sum, item) => sum + item.value, 0);

    // Create pie slices
    let slices: PieChartSlice[] = processedResults.map((item, index) => ({
      label: item.label || 'Unknown',
      value: item.value,
      percentage: this.calculatePercentage(item.value, total),
      color: this.generateColor(index),
    }));

    // Apply topN if specified
    if (topN && topN < slices.length) {
      slices = this.applyTopNToPieSlices(slices, topN);

      // Recalculate percentages after grouping
      const newTotal = slices.reduce((sum, slice) => sum + slice.value, 0);
      slices = slices.map((slice) => ({
        ...slice,
        percentage: this.calculatePercentage(slice.value, newTotal),
      }));
    }

    return {
      series: slices,
      metadata: {
        total,
      },
    };
  }

  /**
   * Get the field to group by based on dimension
   */
  private getGroupByField(dimension: string): string {
    const fields: Record<string, string> = {
      category: 't.category_id',
      product: 't.product_id',
      customer: 't.customer_id',
      region: 'cu.region',
      type: 't.type',
      status: 't.payment_status',
    };
    return fields[dimension] || 't.category_id';
  }

  /**
   * Get the join clause based on dimension
   */
  private getJoinClause(dimension: string): string {
    const joins: Record<string, string> = {
      category: 'LEFT JOIN categories c ON t.category_id = c.id',
      product: 'LEFT JOIN products p ON t.product_id = p.id',
      customer: 'LEFT JOIN customers cu ON t.customer_id = cu.id',
      region: 'LEFT JOIN customers cu ON t.customer_id = cu.id',
    };
    return joins[dimension] || '';
  }

  /**
   * Get the label field based on dimension
   */
  private getLabelField(dimension: string): string {
    const fields: Record<string, string> = {
      category: 'c.name',
      product: 'p.name',
      customer: 'cu.name',
      region: 'cu.region',
      type: 't.type',
      status: 't.payment_status',
    };
    return fields[dimension] || 'c.name';
  }

  /**
   * Apply topN limit specifically for pie slices
   */
  private applyTopNToPieSlices(slices: PieChartSlice[], topN: number): PieChartSlice[] {
    if (topN >= slices.length) return slices;

    // Sort by value descending
    const sorted = [...slices].sort((a, b) => b.value - a.value);

    // Take top N
    const top = sorted.slice(0, topN);
    const others = sorted.slice(topN);

    // If there are others, combine them
    if (others.length > 0) {
      const othersSum = others.reduce((sum, slice) => sum + slice.value, 0);
      const othersPercentage = others.reduce((sum, slice) => sum + slice.percentage, 0);

      top.push({
        label: 'Outros',
        value: othersSum,
        percentage: othersPercentage,
        color: '#9CA3AF', // Gray color for "Others"
      });
    }

    return top;
  }
}
