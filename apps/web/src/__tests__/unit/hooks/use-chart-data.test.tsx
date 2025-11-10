/**
 * Tests for use-chart-data hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import { useChartData, useTableData, useDashboardSummary } from '@/hooks/use-chart-data';
import { chartsService, ChartAPIError } from '@/services/charts.service';
import type { LineChartResponse, TableColumn, TableResponse } from '@dashboard/types';

// Mock the charts service
vi.mock('@/services/charts.service', () => ({
  chartsService: {
    getChartData: vi.fn(),
    getDashboardSummary: vi.fn(),
  },
  ChartAPIError: class ChartAPIError extends Error {
    constructor(public status: number, message: string, public response?: any) {
      super(message);
      this.name = 'ChartAPIError';
    }
  },
}));

const mockedChartsService = vi.mocked(chartsService);

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch chart data successfully', async () => {
    const mockData: LineChartResponse = {
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

    mockedChartsService.getChartData.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(mockedChartsService.getChartData).toHaveBeenCalledWith('line', {
      start: '2024-01-01',
      end: '2024-01-02',
      metric: 'revenue',
    });
  });

  it('should not fetch when dates are missing', () => {
    const { result } = renderHook(
      () =>
        useChartData('line', {
          start: '',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(mockedChartsService.getChartData).not.toHaveBeenCalled();
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(
      () =>
        useChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockedChartsService.getChartData).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const apiError = new ChartAPIError(400, 'Bad Request', { detail: 'Invalid parameters' });
    mockedChartsService.getChartData.mockRejectedValue(apiError);

    const { result } = renderHook(
      () =>
        useChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
  });

  it('should not retry on 4xx errors', async () => {
    const apiError = new ChartAPIError(404, 'Not Found');
    mockedChartsService.getChartData.mockRejectedValue(apiError);

    renderHook(
      () =>
        useChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockedChartsService.getChartData).toHaveBeenCalledTimes(1);
    });

    // Should not retry 4xx errors
    expect(mockedChartsService.getChartData).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx errors', async () => {
    const apiError = new ChartAPIError(500, 'Internal Server Error');
    mockedChartsService.getChartData.mockRejectedValue(apiError);

    renderHook(
      () =>
        useChartData('line', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockedChartsService.getChartData).toHaveBeenCalledTimes(3);
    }, { timeout: 3000 });
  });

  it('should include all chart parameters in query key', async () => {
    const mockData: LineChartResponse = { series: [] };
    mockedChartsService.getChartData.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useChartData('bar', {
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'quantity',
          groupBy: 'week',
          dimension: 'category',
          topN: 10,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedChartsService.getChartData).toHaveBeenCalledWith('bar', {
      start: '2024-01-01',
      end: '2024-01-02',
      metric: 'quantity',
      groupBy: 'week',
      dimension: 'category',
      topN: 10,
    });
  });
});

describe('useTableData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch table data with pagination', async () => {
    const columns: TableColumn[] = [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
    ];
    const mockData: TableResponse = {
      columns,
      rows: [
        { date: '2024-01-01', revenue: 1000 },
        { date: '2024-01-02', revenue: 1200 },
      ],
      cursor: 'next-page-token',
    };

    mockedChartsService.getChartData.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useTableData({
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0]).toEqual(mockData);
    expect(mockedChartsService.getChartData).toHaveBeenCalledWith('table', {
      start: '2024-01-01',
      end: '2024-01-02',
      metric: 'revenue',
      cursor: undefined,
    });
  });

  it('should handle next page param correctly', async () => {
    const columns: TableColumn[] = [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
    ];

    const mockFirstPage: TableResponse = {
      columns,
      rows: [{ date: '2024-01-01', revenue: 1000 }],
      cursor: 'page-2-token',
    };

    const mockSecondPage: TableResponse = {
      columns,
      rows: [{ date: '2024-01-02', revenue: 1200 }],
    };

    mockedChartsService.getChartData
      .mockResolvedValueOnce(mockFirstPage)
      .mockResolvedValueOnce(mockSecondPage);

    const { result } = renderHook(
      () =>
        useTableData({
          start: '2024-01-01',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Fetch next page
    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(mockedChartsService.getChartData).toHaveBeenCalledTimes(2);
    expect(mockedChartsService.getChartData).toHaveBeenLastCalledWith('table', {
      start: '2024-01-01',
      end: '2024-01-02',
      metric: 'revenue',
      cursor: 'page-2-token',
    });
  });

  it('should not fetch when dates are missing', () => {
    const { result } = renderHook(
      () =>
        useTableData({
          start: '',
          end: '2024-01-02',
          metric: 'revenue',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockedChartsService.getChartData).not.toHaveBeenCalled();
  });
});

describe('useDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard summary successfully', async () => {
    const mockSummary = {
      totalRevenue: 45000,
      totalExpenses: 38000,
      totalTransactions: 150,
      averageOrderValue: 300,
    };

    mockedChartsService.getDashboardSummary.mockResolvedValue(mockSummary);

    const { result } = renderHook(
      () =>
        useDashboardSummary({
          start: '2024-01-01',
          end: '2024-01-02',
          categoryId: '1',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSummary);
    expect(mockedChartsService.getDashboardSummary).toHaveBeenCalledWith({
      start: '2024-01-01',
      end: '2024-01-02',
      categoryId: '1',
    });
  });

  it('should not fetch when dates are missing', () => {
    const { result } = renderHook(
      () =>
        useDashboardSummary({
          start: '',
          end: '2024-01-02',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockedChartsService.getDashboardSummary).not.toHaveBeenCalled();
  });

  it('should handle all filter parameters', async () => {
    const mockSummary = { totalRevenue: 45000 };
    mockedChartsService.getDashboardSummary.mockResolvedValue(mockSummary);

    const { result } = renderHook(
      () =>
        useDashboardSummary({
          start: '2024-01-01',
          end: '2024-01-02',
          categoryId: '1',
          productId: '2',
          customerId: '3',
          region: 'US',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedChartsService.getDashboardSummary).toHaveBeenCalledWith({
      start: '2024-01-01',
      end: '2024-01-02',
      categoryId: '1',
      productId: '2',
      customerId: '3',
      region: 'US',
    });
  });

  it('should use shorter stale time for summary data', async () => {
    const mockSummary = { totalRevenue: 45000 };
    mockedChartsService.getDashboardSummary.mockResolvedValue(mockSummary);

    const { result } = renderHook(
      () =>
        useDashboardSummary({
          start: '2024-01-01',
          end: '2024-01-02',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should use 2 minute stale time (shorter than charts)
    expect(result.current.isStale).toBe(false);
  });
});
