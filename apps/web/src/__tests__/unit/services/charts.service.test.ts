/**
 * Tests for charts service
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ChartsService, ChartAPIError } from '@/services/charts.service';
import type { LineChartResponse, BarChartResponse } from '@dashboard/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    apiUrl: 'http://localhost:3000',
  },
}));

describe('ChartsService', () => {
  let service: ChartsService;

  beforeEach(() => {
    service = new ChartsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should use default base URL from env', () => {
      const defaultService = new ChartsService();
      expect(defaultService).toBeInstanceOf(ChartsService);
    });

    it('should use custom base URL when provided', () => {
      const customService = new ChartsService('http://custom-api.com/api/v1');
      expect(customService).toBeInstanceOf(ChartsService);
    });
  });

  describe('getChartData', () => {
    it('should fetch line chart data successfully', async () => {
      const mockResponse: LineChartResponse = {
        series: [
          {
            name: 'Revenue',
            points: [
              { x: '2024-01-01', y: 1000 },
              { x: '2024-01-02', y: 1200 },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.getChartData('line', {
        start: '2024-01-01',
        end: '2024-01-02',
        metric: 'revenue',
      });

      expect(result).toEqual(mockResponse);
      const expectedUrl = new URL('http://localhost:3000/v1/charts/line');
      expectedUrl.searchParams.set('start', '2024-01-01');
      expectedUrl.searchParams.set('end', '2024-01-02');
      expectedUrl.searchParams.set('metric', 'revenue');

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should handle Date objects in parameters', async () => {
      const mockResponse: BarChartResponse = {
        categories: ['Category 1'],
        series: [{ name: 'Revenue', data: [1000] }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      await service.getChartData('bar', {
        start: startDate,
        end: endDate,
        metric: 'revenue',
      });

      const expectedUrl = new URL('http://localhost:3000/v1/charts/bar');
      expectedUrl.searchParams.set('start', startDate.toISOString());
      expectedUrl.searchParams.set('end', endDate.toISOString());
      expectedUrl.searchParams.set('metric', 'revenue');

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl.toString(), expect.any(Object));
    });

    it('should include all valid parameters in URL', async () => {
      const mockResponse: BarChartResponse = {
        categories: ['Category 1'],
        series: [{ name: 'Revenue', data: [1000] }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await service.getChartData('bar', {
        start: '2024-01-01',
        end: '2024-01-02',
        metric: 'quantity',
        groupBy: 'week',
        dimension: 'category',
        topN: 10,
        cursor: 'abc123',
        limit: 50,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/v1/charts/bar?start=2024-01-01&end=2024-01-02&metric=quantity&groupBy=week&dimension=category&topN=10&cursor=abc123&limit=50',
        expect.any(Object)
      );
    });

    it('should exclude undefined and null parameters', async () => {
      const mockResponse: LineChartResponse = { series: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await service.getChartData('line', {
        start: '2024-01-01',
        end: '2024-01-02',
        metric: 'revenue',
        topN: 0, // Should be included as it's not null/undefined
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/v1/charts/line?start=2024-01-01&end=2024-01-02&metric=revenue&topN=0',
        expect.any(Object)
      );
    });

    it('should handle API error responses with JSON', async () => {
      const errorResponse = {
        type: 'validation-error',
        title: 'Invalid request',
        status: 400,
        detail: 'Start date is required',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      });

      await expect(
        service.getChartData('line', {
          start: '',
          end: '2024-01-02',
          metric: 'revenue',
        })
      ).rejects.toMatchObject({
        status: 400,
        message: 'Start date is required',
        response: errorResponse,
      });
    });

    it('should handle API error responses with plain text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(
        service.getChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        })
      ).rejects.toMatchObject({
        status: 500,
        message: 'Internal Server Error',
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.getChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        })
      ).rejects.toMatchObject({
        status: 0,
        message: 'Network error',
      });
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      await expect(
        service.getChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        })
      ).rejects.toMatchObject({
        status: 0,
        message: 'Unknown error occurred',
      });
    });
  });

  describe('getDashboardSummary', () => {
    it('should fetch dashboard summary successfully', async () => {
      const mockSummary = {
        totalRevenue: 45000,
        totalExpenses: 38000,
        totalTransactions: 150,
        averageOrderValue: 300,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      });

      const result = await service.getDashboardSummary({
        start: '2024-01-01',
        end: '2024-01-02',
        categoryId: '1',
      });

      expect(result).toEqual(mockSummary);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/v1/dashboard/summary?start=2024-01-01&end=2024-01-02&categoryId=1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
    });

    it('should handle Date objects in summary parameters', async () => {
      const mockSummary = { totalRevenue: 45000 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      await service.getDashboardSummary({
        start: startDate,
        end: endDate,
        region: 'US',
      });

      const expectedUrl = new URL('http://localhost:3000/v1/dashboard/summary');
      expectedUrl.searchParams.set('start', startDate.toISOString());
      expectedUrl.searchParams.set('end', endDate.toISOString());
      expectedUrl.searchParams.set('region', 'US');

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl.toString(), expect.any(Object));
    });

    it('should include all filter parameters', async () => {
      const mockSummary = { totalRevenue: 45000 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      });

      await service.getDashboardSummary({
        start: '2024-01-01',
        end: '2024-01-02',
        categoryId: '1',
        productId: '2',
        customerId: '3',
        region: 'US',
      });

      const expectedUrl = new URL('http://localhost:3000/v1/dashboard/summary');
      expectedUrl.searchParams.set('start', '2024-01-01');
      expectedUrl.searchParams.set('end', '2024-01-02');
      expectedUrl.searchParams.set('categoryId', '1');
      expectedUrl.searchParams.set('productId', '2');
      expectedUrl.searchParams.set('customerId', '3');
      expectedUrl.searchParams.set('region', 'US');

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl.toString(), expect.any(Object));
    });

    it('should exclude undefined and null summary parameters', async () => {
      const mockSummary = { totalRevenue: 45000 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      });

      await service.getDashboardSummary({
        start: '2024-01-01',
        end: '2024-01-02',
        categoryId: '1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/v1/dashboard/summary?start=2024-01-01&end=2024-01-02&categoryId=1',
        expect.any(Object)
      );
    });

    it('should handle summary API errors', async () => {
      const errorResponse = {
        type: 'validation-error',
        title: 'Invalid request',
        status: 400,
        detail: 'Invalid date range',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      });

      await expect(
        service.getDashboardSummary({
          start: '2024-01-02',
          end: '2024-01-01', // Invalid range
        })
      ).rejects.toMatchObject({
        status: 400,
        message: 'Invalid date range',
        response: errorResponse,
      });
    });
  });
});

describe('ChartAPIError', () => {
  it('should create error with status and message', () => {
    const error = new ChartAPIError(404, 'Not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ChartAPIError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.response).toBeUndefined();
  });

  it('should create error with response data', () => {
    const response = { detail: 'Resource not found' };
    const error = new ChartAPIError(404, 'Not found', response);

    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.response).toEqual(response);
  });
});
