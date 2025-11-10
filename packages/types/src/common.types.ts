/**
 * Common type definitions
 */

/**
 * Pagination types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  cursor?: string;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Common API Response types
 */
export interface CommonApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, any>;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string | string[]>;
}

/**
 * Date range types
 */
export interface DateRange {
  start: string | Date;
  end: string | Date;
}

/**
 * Option types (for selects/dropdowns)
 */
export interface Option<T = string> {
  id: string | number;
  label: string;
  value: T;
  metadata?: Record<string, any>;
  disabled?: boolean;
}

/**
 * Filter types
 */
export interface FilterParams {
  search?: string;
  categories?: string[];
  products?: string[];
  customers?: string[];
  regions?: string[];
  status?: string[];
  dateRange?: DateRange;
}

/**
 * Sort types
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Status types
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Utility types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

/**
 * Brand types for type safety
 */
export type Brand<K, T> = K & { __brand: T };

export type UUID = Brand<string, 'UUID'>;
export type Email = Brand<string, 'Email'>;
export type URL = Brand<string, 'URL'>;
export type CPF = Brand<string, 'CPF'>;
export type CNPJ = Brand<string, 'CNPJ'>;
export type Phone = Brand<string, 'Phone'>;
export type Currency = Brand<number, 'Currency'>;
export type Percentage = Brand<number, 'Percentage'>;
export type Timestamp = Brand<number, 'Timestamp'>;
export type ISODateTime = Brand<string, 'ISODateTime'>;
