/**
 * Chart Types and Interfaces
 * Core type definitions for the dynamic chart system
 */

import { z } from 'zod';

// Chart type enum
export const ChartType = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  TABLE: 'table',
  KPI: 'kpi',
} as const;

export type ChartTypeEnum = (typeof ChartType)[keyof typeof ChartType];

// Metric enum
export const Metric = {
  REVENUE: 'revenue',
  EXPENSE: 'expense',
  PROFIT: 'profit',
  QUANTITY: 'quantity',
  COUNT: 'count',
} as const;

export type MetricEnum = (typeof Metric)[keyof typeof Metric];

// Group by enum
export const GroupBy = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CATEGORY: 'category',
  PRODUCT: 'product',
  CUSTOMER: 'customer',
  REGION: 'region',
} as const;

export type GroupByEnum = (typeof GroupBy)[keyof typeof GroupBy];

// Request schemas
export const chartParamsSchema = z.object({
  chartType: z.enum(['pie', 'line', 'bar', 'table', 'kpi']),
});

export const chartQuerySchema = z
  .object({
    start: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    end: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    metric: z
      .enum(['revenue', 'expense', 'profit', 'quantity', 'count'])
      .default('revenue'),
    groupBy: z
      .enum([
        'day',
        'week',
        'month',
        'quarter',
        'year',
        'category',
        'product',
        'customer',
        'region',
      ])
      .optional(),
    dimension: z.string().optional(),
    topN: z.coerce.number().min(1).max(100).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    categoryId: z.string().optional(),
    productId: z.string().optional(),
    customerId: z.string().optional(),
    region: z.string().optional(),
  })
  .refine((data) => new Date(data.start) <= new Date(data.end), {
    message: 'Start date must be before or equal to end date',
  });

export type ChartParams = z.infer<typeof chartParamsSchema>;
export type ChartQuery = z.infer<typeof chartQuerySchema>;

// Combined request type
export interface ChartRequest extends ChartParams, ChartQuery {}

// Response types for different chart formats
export interface LineChartPoint {
  x: string; // ISO date string or label
  y: number;
}

export interface LineChartSeries {
  name: string;
  points: LineChartPoint[];
  color?: string;
}

export interface LineChartResponse {
  series: LineChartSeries[];
  metadata?: {
    total?: number;
    average?: number;
    min?: number;
    max?: number;
  };
}

export interface PieChartSlice {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface PieChartResponse {
  series: PieChartSlice[];
  metadata?: {
    total: number;
  };
}

export interface BarChartResponse {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
  metadata?: {
    total?: number;
    average?: number;
  };
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface TableChartResponse {
  columns: TableColumn[];
  rows: TableRow[];
  cursor?: string;
  hasMore?: boolean;
  total?: number;
}

export interface KPIValue {
  current: number;
  previous?: number;
  change?: number;
  changePercentage?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPIChartResponse {
  metrics: {
    [key: string]: KPIValue;
  };
  period: {
    current: { start: string; end: string };
    previous?: { start: string; end: string };
  };
}

// Union type for all chart responses
export type ChartResponse =
  | LineChartResponse
  | PieChartResponse
  | BarChartResponse
  | TableChartResponse
  | KPIChartResponse;

// Type guards
export function isLineChartResponse(
  response: ChartResponse,
): response is LineChartResponse {
  return 'series' in response && Array.isArray(response.series)
    && response.series.length > 0
    && response.series[0] !== undefined
    && 'points' in response.series[0];
}

export function isPieChartResponse(
  response: ChartResponse,
): response is PieChartResponse {
  return 'series' in response && Array.isArray(response.series)
    && response.series.length > 0
    && response.series[0] !== undefined
    && 'percentage' in response.series[0];
}

export function isBarChartResponse(
  response: ChartResponse,
): response is BarChartResponse {
  return 'categories' in response && 'series' in response;
}

export function isTableChartResponse(
  response: ChartResponse,
): response is TableChartResponse {
  return 'columns' in response && 'rows' in response;
}

export function isKPIChartResponse(
  response: ChartResponse,
): response is KPIChartResponse {
  return 'metrics' in response && 'period' in response;
}
