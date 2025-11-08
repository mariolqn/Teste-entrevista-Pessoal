/**
 * Chart-related type definitions
 */

import type { DateRange } from './common.types';

/**
 * Chart types
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'table' | 'kpi';

/**
 * Metric types
 */
export type MetricType = 'revenue' | 'expense' | 'profit' | 'quantity' | 'count';

/**
 * Group by types
 */
export type GroupByType =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'category'
  | 'product'
  | 'customer'
  | 'region';

/**
 * Chart request parameters
 */
export interface ChartParams extends DateRange {
  chartType: ChartType;
  metric?: MetricType;
  groupBy?: GroupByType;
  dimension?: string;
  topN?: number;
  cursor?: string;
  limit?: number;
}

/**
 * Chart data point
 */
export interface ChartPoint {
  x: string | number;
  y: number;
}

/**
 * Line chart types
 */
export interface LineChartSeries {
  name: string;
  points: ChartPoint[];
  color?: string;
}

export interface LineChartResponse {
  series: LineChartSeries[];
}

/**
 * Bar chart types
 */
export interface BarChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface BarChartResponse {
  categories: string[];
  series: BarChartSeries[];
}

/**
 * Pie chart types
 */
export interface PieChartSegment {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface PieChartResponse {
  series: PieChartSegment[];
  total: number;
}

/**
 * Table types
 */
export interface TableColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
}

export interface TableRow {
  [key: string]: any;
}

export interface TableResponse {
  columns: TableColumn[];
  rows: TableRow[];
  cursor?: string;
  hasMore?: boolean;
  total?: number;
}

/**
 * KPI types
 */
export interface KPIValue {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPIResponse {
  revenue: KPIValue;
  expense: KPIValue;
  profit: KPIValue;
  customers?: KPIValue;
  transactions?: KPIValue;
}

/**
 * Dashboard summary types
 */
export interface DashboardSummary {
  totalRevenue: number;
  totalExpense: number;
  liquidProfit: number;
  overdueAccounts: {
    receivable: number;
    payable: number;
  };
  upcomingAccounts: {
    receivable: number;
    payable: number;
  };
  periodComparison?: {
    revenue: {
      current: number;
      previous: number;
      change: number;
    };
    expense: {
      current: number;
      previous: number;
      change: number;
    };
  };
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  height?: number | string;
  width?: number | string;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  responsive?: boolean;
}

/**
 * Chart filter
 */
export interface ChartFilter {
  dateRange: DateRange;
  metric: MetricType;
  groupBy?: GroupByType;
  categories?: string[];
  products?: string[];
  customers?: string[];
  regions?: string[];
}

/**
 * Chart export types
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png';

export interface ChartExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  includeMetadata?: boolean;
}
