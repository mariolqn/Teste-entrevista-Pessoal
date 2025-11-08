/**
 * API-related type definitions
 */

import type {
  ChartType,
  MetricType,
  GroupByType,
  LineChartResponse,
  BarChartResponse,
  PieChartResponse,
  TableResponse,
  KPIResponse,
  DashboardSummary,
} from './chart.types';
import type { DateRange, PaginationParams, Option } from './common.types';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  CHARTS: '/charts',
  OPTIONS: '/options',
  DASHBOARD: '/dashboard',
  HEALTH: '/healthz',
} as const;

/**
 * Chart endpoint types
 */
export interface ChartEndpointParams extends DateRange {
  metric?: MetricType;
  groupBy?: GroupByType;
  dimension?: string;
  topN?: number;
  cursor?: string;
  limit?: number;
}

export type ChartEndpointResponse<T extends ChartType> = T extends 'line'
  ? LineChartResponse
  : T extends 'bar'
  ? BarChartResponse
  : T extends 'pie'
  ? PieChartResponse
  : T extends 'table'
  ? TableResponse
  : T extends 'kpi'
  ? KPIResponse
  : never;

/**
 * Options endpoint types
 */
export type OptionEntity = 'categories' | 'products' | 'customers' | 'regions';

export interface OptionsEndpointParams extends PaginationParams {
  search?: string;
}

export interface OptionsEndpointResponse<T = any> {
  items: Option<T>[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

/**
 * Dashboard endpoint types
 */
export interface DashboardSummaryParams extends DateRange {
  categoryId?: string;
  productId?: string;
  customerId?: string;
  region?: string;
}

export type DashboardSummaryResponse = DashboardSummary;

/**
 * Health check types
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version?: string;
  services?: {
    database: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
  };
}

/**
 * Error response types
 */
export interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Request headers
 */
export interface RequestHeaders {
  'Content-Type'?: string;
  Accept?: string;
  Authorization?: string;
  'X-Request-ID'?: string;
  'X-API-Version'?: string;
  'If-None-Match'?: string;
  'Cache-Control'?: string;
}

/**
 * Response headers
 */
export interface ResponseHeaders {
  'Content-Type': string;
  'X-Request-ID': string;
  'X-Response-Time': string;
  'X-Rate-Limit-Limit'?: string;
  'X-Rate-Limit-Remaining'?: string;
  'X-Rate-Limit-Reset'?: string;
  ETag?: string;
  'Cache-Control'?: string;
  'Last-Modified'?: string;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: RequestHeaders;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  credentials?: 'include' | 'same-origin' | 'omit';
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: RequestHeaders;
  params?: Record<string, any>;
  body?: any;
  signal?: AbortSignal;
  cache?: RequestCache;
  credentials?: RequestCredentials;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: ResponseHeaders;
  config?: ApiRequestOptions;
}
