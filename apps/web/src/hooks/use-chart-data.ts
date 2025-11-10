/**
 * Chart data hooks
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import type { ChartType, DateRange } from '@dashboard/types';

import { chartsService, type ChartParams } from '@/services/charts.service';

/**
 * Hook for fetching chart data
 */
export function useChartData<T extends ChartType>(
  type: T,
  params: ChartParams & {
    enabled?: boolean;
  },
) {
  const { enabled = true, ...chartParams } = params;

  return useQuery({
    queryKey: ['chart', type, chartParams],
    queryFn: () => chartsService.getChartData(type, chartParams),
    enabled: enabled && Boolean(chartParams.start && chartParams.end),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && /4\d{2}/.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for fetching paginated table data
 */
export function useTableData(
  params: ChartParams & {
    enabled?: boolean;
  },
) {
  const { enabled = true, ...chartParams } = params;

  return useInfiniteQuery({
    queryKey: ['chart', 'table', chartParams],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      chartsService.getChartData('table', {
        ...chartParams,
        cursor: pageParam || undefined,
      }),
    getNextPageParam: (lastPage) => {
      return (lastPage as any).cursor || undefined;
    },
    enabled: enabled && Boolean(chartParams.start && chartParams.end),
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialPageParam: undefined as string | undefined,
  });
}

/**
 * Hook for fetching dashboard summary
 */
export function useDashboardSummary(
  params: DateRange & {
    categoryId?: string;
    productId?: string;
    customerId?: string;
    region?: string;
    enabled?: boolean;
  },
) {
  const { enabled = true, ...summaryParams } = params;

  return useQuery({
    queryKey: ['dashboard', 'summary', summaryParams],
    queryFn: () => chartsService.getDashboardSummary(summaryParams),
    enabled: enabled && Boolean(summaryParams.start && summaryParams.end),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && /4\d{2}/.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
