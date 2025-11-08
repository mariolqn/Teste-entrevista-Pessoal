/**
 * Bar Chart Strategy Implementation
 * Generates comparative data for bar charts
 */

import { PrismaClient } from '@prisma/client';
import { BaseChartStrategy } from '../chart.strategy.js';
import type {
  ChartRequest,
  BarChartResponse,
} from '../../../types/charts.types.js';

export class BarChartStrategy extends BaseChartStrategy {
  getName(): string {
    return 'BarChartStrategy';
  }

  canHandle(params: ChartRequest): boolean {
    return params.chartType === 'bar';
  }

  async execute(
    params: ChartRequest,
    prisma: PrismaClient,
  ): Promise<BarChartResponse> {
    const { 
      start, 
      end, 
      metric, 
      groupBy = 'category',
      dimension = 'type',
      topN 
    } = params;

    // Determine primary and secondary grouping
    const primaryGroup = this.getPrimaryGroupField(groupBy);
    const secondaryGroup = this.getSecondaryGroupField(dimension);
    const joinClauses = this.getJoinClauses(groupBy, dimension);
    const primaryLabel = this.getPrimaryLabelField(groupBy);
    const secondaryLabel = this.getSecondaryLabelField(dimension);

    // Build the query
    const metricAggregation = this.getMetricAggregation(metric);
    const dimensionFilters = this.buildDimensionFilters(params);

    // Create WHERE clause conditions
    const whereConditions = [`t.occurred_at >= ? AND t.occurred_at <= ?`];
    const whereParams: any[] = [
      new Date(start + 'T00:00:00.000Z'),
      new Date(end + 'T23:59:59.999Z'),
    ];

    if (dimensionFilters.categoryId) {
      whereConditions.push('t.category_id = ?');
      whereParams.push(dimensionFilters.categoryId);
    }

    if (dimensionFilters.productId) {
      whereConditions.push('t.product_id = ?');
      whereParams.push(dimensionFilters.productId);
    }

    if (dimensionFilters.customerId) {
      whereConditions.push('t.customer_id = ?');
      whereParams.push(dimensionFilters.customerId);
    }

    // Build query for bar chart data
    const query = `
      SELECT 
        ${primaryLabel} as category,
        ${secondaryLabel} as series_name,
        ${metricAggregation} as value
      FROM transactions t
      ${joinClauses}
      WHERE ${whereConditions.join(' AND ')}
        AND ${primaryGroup} IS NOT NULL
      GROUP BY ${primaryGroup}, ${secondaryGroup}, category, series_name
      ORDER BY value DESC, category ASC
    `;

    const results = await prisma.$queryRawUnsafe<
      Array<{
        category: string;
        series_name: string;
        value: number | bigint;
      }>
    >(query, ...whereParams);

    // Process results
    const processedResults = results.map(r => ({
      ...r,
      value: Number(r.value),
    }));

    // Group data by category and series
    const categoryMap = new Map<string, Map<string, number>>();
    const seriesSet = new Set<string>();
    const categoryTotals = new Map<string, number>();

    processedResults.forEach(row => {
      const category = row.category || 'Unknown';
      const series = this.formatSeriesName(row.series_name || 'Unknown');
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
        categoryTotals.set(category, 0);
      }
      
      categoryMap.get(category)!.set(series, row.value);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + row.value);
      seriesSet.add(series);
    });

    // Apply topN to categories if specified
    let categories = Array.from(categoryMap.keys());
    if (topN && topN < categories.length) {
      // Sort categories by total value
      const sortedCategories = categories
        .map(cat => ({ name: cat, total: categoryTotals.get(cat) || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, topN)
        .map(item => item.name);
      
      categories = sortedCategories;
    }

    // Build series data
    const seriesNames = Array.from(seriesSet);
    const series = seriesNames.map((seriesName, index) => ({
      name: seriesName,
      data: categories.map(category => {
        const categoryData = categoryMap.get(category);
        return categoryData?.get(seriesName) || 0;
      }),
      color: this.generateColor(index),
    }));

    // Calculate metadata
    const total = processedResults.reduce((sum, r) => sum + r.value, 0);
    const average = processedResults.length > 0 
      ? total / processedResults.length 
      : 0;

    return {
      categories,
      series,
      metadata: {
        total,
        average,
      },
    };
  }

  /**
   * Get primary group field for bar chart
   */
  private getPrimaryGroupField(groupBy: string): string {
    const fields: Record<string, string> = {
      category: 't.category_id',
      product: 't.product_id',
      customer: 't.customer_id',
      region: 'cu.region',
      month: "DATE_FORMAT(t.occurred_at, '%Y-%m')",
      quarter: "CONCAT(YEAR(t.occurred_at), '-Q', QUARTER(t.occurred_at))",
      year: 'YEAR(t.occurred_at)',
    };
    return fields[groupBy] || 't.category_id';
  }

  /**
   * Get secondary group field for series
   */
  private getSecondaryGroupField(dimension: string): string {
    const fields: Record<string, string> = {
      type: 't.type',
      status: 't.payment_status',
      category: 't.category_id',
      product: 't.product_id',
    };
    return fields[dimension] || 't.type';
  }

  /**
   * Get join clauses for bar chart
   */
  private getJoinClauses(groupBy: string, dimension: string): string {
    const joins = new Set<string>();

    // Add joins based on groupBy
    if (['category'].includes(groupBy) || ['category'].includes(dimension)) {
      joins.add('LEFT JOIN categories c ON t.category_id = c.id');
    }
    if (['product'].includes(groupBy) || ['product'].includes(dimension)) {
      joins.add('LEFT JOIN products p ON t.product_id = p.id');
    }
    if (['customer', 'region'].includes(groupBy) || ['customer', 'region'].includes(dimension)) {
      joins.add('LEFT JOIN customers cu ON t.customer_id = cu.id');
    }

    return Array.from(joins).join(' ');
  }

  /**
   * Get primary label field
   */
  private getPrimaryLabelField(groupBy: string): string {
    const fields: Record<string, string> = {
      category: 'c.name',
      product: 'p.name',
      customer: 'cu.name',
      region: 'cu.region',
      month: "DATE_FORMAT(t.occurred_at, '%Y-%m')",
      quarter: "CONCAT(YEAR(t.occurred_at), '-Q', QUARTER(t.occurred_at))",
      year: 'YEAR(t.occurred_at)',
    };
    return fields[groupBy] || 'c.name';
  }

  /**
   * Get secondary label field
   */
  private getSecondaryLabelField(dimension: string): string {
    const fields: Record<string, string> = {
      type: 't.type',
      status: 't.payment_status',
      category: 'c.name',
      product: 'p.name',
    };
    return fields[dimension] || 't.type';
  }

  /**
   * Format series name for display
   */
  private formatSeriesName(name: string): string {
    const nameMap: Record<string, string> = {
      'REVENUE': 'Receita',
      'EXPENSE': 'Despesa',
      'PENDING': 'Pendente',
      'PAID': 'Pago',
      'OVERDUE': 'Vencido',
      'CANCELLED': 'Cancelado',
    };
    return nameMap[name] || name;
  }
}
