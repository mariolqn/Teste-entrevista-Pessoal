/**
 * Chart API service
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
} from '@dashboard/types';

import { env } from '@/lib/env';

/**
 * Chart request parameters
 */
export interface ChartParams {
  start: string | Date;
  end: string | Date;
  metric?: MetricType;
  groupBy?: GroupByType;
  dimension?: string;
  topN?: number;
  cursor?: string | undefined;
  limit?: number;
}

/**
 * Chart response type mapping
 */
type ChartResponseMap = {
  line: LineChartResponse;
  bar: BarChartResponse;
  pie: PieChartResponse;
  table: TableResponse;
  kpi: KPIResponse;
};

/**
 * API Error class
 */
export class ChartAPIError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: any,
  ) {
    super(message);
    this.name = 'ChartAPIError';
  }
}

/**
 * Chart API service
 */
export class ChartsService {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || `${env.apiUrl}/v1`;
  }

  /**
   * Fetch chart data
   */
  async getChartData<T extends ChartType>(
    type: T,
    params: ChartParams,
  ): Promise<ChartResponseMap[T]> {
    const url = new URL(`${this.baseURL}/charts/${type}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const stringValue = value instanceof Date ? value.toISOString() : String(value);
        url.searchParams.append(key, stringValue);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new ChartAPIError(
          response.status,
          errorData.detail || errorData.message || `HTTP ${response.status}`,
          errorData,
        );
      }

      return (await response.json()) as ChartResponseMap[T];
    } catch (error) {
      if (error instanceof ChartAPIError) {
        throw error;
      }

      throw new ChartAPIError(
        0,
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(params: {
    start: string | Date;
    end: string | Date;
    categoryId?: string;
    productId?: string;
    customerId?: string;
    region?: string;
  }) {
    const url = new URL(`${this.baseURL}/dashboard/summary`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const stringValue = value instanceof Date ? value.toISOString() : String(value);
        url.searchParams.append(key, stringValue);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new ChartAPIError(
          response.status,
          errorData.detail || errorData.message || `HTTP ${response.status}`,
          errorData,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ChartAPIError) {
        throw error;
      }

      throw new ChartAPIError(
        0,
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}

/**
 * Default charts service instance
 */
export const chartsService = new ChartsService();
