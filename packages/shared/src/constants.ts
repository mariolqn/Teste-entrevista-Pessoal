/**
 * Shared constants across the application
 */

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'dd/MM/yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  MONTH_YEAR: 'MMM yyyy',
  FULL: 'EEEE, MMMM do, yyyy',
} as const;

export const CURRENCY = {
  CODE: 'BRL',
  SYMBOL: 'R$',
  LOCALE: 'pt-BR',
  DECIMAL_PLACES: 2,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  TABLE: 'table',
  KPI: 'kpi',
} as const;

export const METRICS = {
  REVENUE: 'revenue',
  EXPENSE: 'expense',
  PROFIT: 'profit',
  QUANTITY: 'quantity',
  COUNT: 'count',
} as const;

export const GROUP_BY = {
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

export const TRANSACTION_TYPES = {
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
