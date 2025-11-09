/**
 * Unit tests for ChartService orchestration logic
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ChartService } from '../../../src/services/charts/chart.service.js';
import { cacheService } from '../../../src/lib/redis.js';
import { config } from '../../../src/config/index.js';
import { LineChartStrategy } from '../../../src/services/charts/strategies/line-chart.strategy.js';

const prismaMock = {
  $queryRawUnsafe: vi.fn(),
  transaction: {
    aggregate: vi.fn(),
  },
} as unknown as PrismaClient;

const originalCacheFlag = config.featureCacheEnabled;
const originalRedisTtl = config.redisTtl;

describe('Unit :: ChartService', () => {
  let service: ChartService;

  beforeEach(() => {
    service = new ChartService(prismaMock);
    config.featureCacheEnabled = false;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    config.featureCacheEnabled = originalCacheFlag;
    config.redisTtl = originalRedisTtl;
    vi.restoreAllMocks();
  });

  it('validateParams should detect invalid date ranges and limits', () => {
    const errors = service.validateParams({
      chartType: 'line',
      start: '2024-05-10',
      end: '2024-05-01',
      metric: 'revenue',
      groupBy: 'invalid' as any,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'Start date must be before or equal to end date',
        'Invalid groupBy value for line chart',
      ]),
    );
  });

  it('getAvailableChartTypes should return all supported types', () => {
    const types = service.getAvailableChartTypes();
    expect(types).toEqual(expect.arrayContaining(['line', 'bar', 'pie', 'table', 'kpi']));
  });

  it('getStrategyMetadata should expose strategy capabilities', () => {
    const metadata = service.getStrategyMetadata('pie');
    expect(metadata.name).toBe('Pie Chart');
    expect(metadata.supportedMetrics).toContain('revenue');
    expect(metadata.supportedGroupBy).toContain('category');
    expect(metadata.supportsPagination).toBe(false);
  });

  it('should read from cache and skip strategy execution when cached data exists', async () => {
    const cachedResponse = { series: [] };
    config.featureCacheEnabled = true;
    const cacheGetSpy = vi.spyOn(cacheService, 'get').mockResolvedValueOnce(cachedResponse);
    const executeSpy = vi
      .spyOn(LineChartStrategy.prototype, 'execute')
      .mockResolvedValueOnce({ series: [] } as any);

    const result = await service.getChartData({
      chartType: 'line',
      start: '2024-01-01',
      end: '2024-01-31',
      metric: 'revenue',
    });

    expect(cacheGetSpy).toHaveBeenCalled();
    expect(executeSpy).not.toHaveBeenCalled();
    expect(result).toBe(cachedResponse);
  });

  it('should execute strategy and populate cache when caching is enabled', async () => {
    const strategyResult = { series: [{ name: 'Receita', points: [] }] };
    config.featureCacheEnabled = true;
    config.redisTtl = 120;

    const cacheGetSpy = vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    const cacheSetSpy = vi.spyOn(cacheService, 'set').mockResolvedValue(true);
    const executeSpy = vi
      .spyOn(LineChartStrategy.prototype, 'execute')
      .mockResolvedValueOnce(strategyResult as any);

    const result = await service.getChartData({
      chartType: 'line',
      start: '2024-01-01',
      end: '2024-01-31',
      metric: 'revenue',
    });

    expect(cacheGetSpy).toHaveBeenCalled();
    expect(executeSpy).toHaveBeenCalled();
    expect(cacheSetSpy).toHaveBeenCalledWith(expect.any(String), strategyResult, 120);
    expect(result).toEqual(strategyResult);
  });

  it('should throw for unsupported chart types', async () => {
    await expect(
      service.getChartData({
        chartType: 'radar' as any,
        start: '2024-01-01',
        end: '2024-01-02',
        metric: 'revenue',
      }),
    ).rejects.toThrowError('Unsupported chart type: radar');
  });
});

