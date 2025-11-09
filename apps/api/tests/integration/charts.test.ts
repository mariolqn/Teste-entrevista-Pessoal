/**
 * Integration tests for chart endpoints
 */

import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

function buildDateRange(daysBack = 120, daysForward = 30) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  const end = new Date(now);
  end.setDate(end.getDate() + daysForward);

  const format = (date: Date) => date.toISOString().split('T')[0]!;
  return { start: format(start), end: format(end) };
}

describe('Integration :: Charts Endpoints', () => {
  let app: FastifyInstance;
  const { start, end } = buildDateRange();

  const fetchSummary = async () => {
    const summaryResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      query: { start, end },
    });

    expect(summaryResponse.statusCode).toBe(200);
    return summaryResponse.json();
  };

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject requests without mandatory date filters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/line',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.message ?? body.detail ?? '').toContain('start');
  });

  it('should return line chart data that matches summary totals', async () => {
    const summary = await fetchSummary();

    const revenueResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/line',
      query: {
        start,
        end,
        groupBy: 'day',
        metric: 'revenue',
      },
    });

    expect(revenueResponse.statusCode).toBe(200);
    const revenueBody = revenueResponse.json();
    const revenueSeries = revenueBody.series.find((series: any) => series.name === 'Receita');
    expect(revenueSeries).toBeDefined();
    const revenueTotal = revenueSeries.points.reduce(
      (sum: number, point: any) => sum + point.y,
      0,
    );
    expect(revenueTotal).toBeGreaterThan(0);
    expect(revenueTotal).toBeCloseTo(summary.totalRevenue, 2);

    const expenseResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/line',
      query: {
        start,
        end,
        groupBy: 'day',
        metric: 'expense',
      },
    });

    expect(expenseResponse.statusCode).toBe(200);
    const expenseBody = expenseResponse.json();
    const expenseSeries = expenseBody.series.find((series: any) => series.name === 'Despesa');
    expect(expenseSeries).toBeDefined();
    const expenseTotal = expenseSeries.points.reduce(
      (sum: number, point: any) => sum + point.y,
      0,
    );
    expect(expenseTotal).toBeGreaterThan(0);
    expect(expenseTotal).toBeCloseTo(summary.totalExpense, 2);
  });

  it('should return pie chart data grouped by category', async () => {
    const summary = await fetchSummary();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/pie',
      query: {
        start,
        end,
        groupBy: 'category',
        metric: 'revenue',
        topN: '5',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.series).toBeInstanceOf(Array);
    expect(body.series.length).toBeGreaterThan(0);

    const topSlice = body.series[0];
    expect(topSlice.label.toUpperCase()).toContain('SUZANO');
    const totalValue = body.series.reduce((total: number, slice: any) => total + slice.value, 0);
    expect(totalValue).toBeCloseTo(summary.totalRevenue, 2);
    expect(topSlice.value).toBeGreaterThan(0);
  });

  it('should return paginated table data with cursor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/table',
      query: {
        start,
        end,
        limit: '1',
        dimension: 'category',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.columns).toBeInstanceOf(Array);
    expect(body.rows).toBeInstanceOf(Array);
    expect(body.rows.length).toBe(1);
    expect(body.total).toBeGreaterThan(0);
    expect(body.hasMore).toBe(true);
    expect(body.cursor).toBeDefined();
  });

  it('should return table data grouped by product', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/table',
      query: {
        start,
        end,
        limit: '5',
        dimension: 'product',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.rows.length).toBeGreaterThan(0);
    body.rows.forEach((row: any) => {
      expect(row.name).toBeDefined();
      expect(row.total_amount).toBeDefined();
    });
  });

  it('should return table data grouped by customer', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/table',
      query: {
        start,
        end,
        limit: '5',
        dimension: 'customer',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.rows.length).toBeGreaterThan(0);
    body.rows.forEach((row: any) => {
      expect(row.name).toBeDefined();
      expect(row.total_revenue).toBeDefined();
    });
  });

  it('should return transactional table data with pagination cursor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/table',
      query: {
        start,
        end,
        limit: '5',
        dimension: 'transactions',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.columns.some((col: any) => col.key === 'occurredAt')).toBe(true);
    expect(body.rows.length).toBeGreaterThan(0);
  });

  it('should return bar chart data grouped by category', async () => {
    const summary = await fetchSummary();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/bar',
      query: {
        start,
        end,
        dimension: 'category',
        metric: 'revenue',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.categories).toBeInstanceOf(Array);
    expect(body.categories.length).toBeGreaterThan(0);
    expect(body.series).toBeInstanceOf(Array);
    expect(body.series[0].data.length).toBe(body.categories.length);

    const total = body.series[0].data.reduce((sum: number, value: number) => sum + value, 0);
    expect(total).toBeCloseTo(summary.totalRevenue, 2);
  });

  it('should return KPI metrics with trend analysis', async () => {
    const summary = await fetchSummary();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/kpi',
      query: {
        start,
        end,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.metrics).toBeDefined();
    expect(body.metrics.revenue.current).toBeCloseTo(summary.totalRevenue, 2);
    expect(body.metrics.expense.current).toBeCloseTo(summary.totalExpense, 2);
    expect(body.metrics.profit.current).toBeCloseTo(summary.liquidProfit, 2);
    expect(body.period.current.start).toBe(start);
    expect(body.period.current.end).toBe(end);
  });

  it('should expose chart metadata and available types', async () => {
    const metadataResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/line/metadata',
    });

    expect(metadataResponse.statusCode).toBe(200);
    expect(metadataResponse.json().supportedMetrics).toContain('revenue');

    const typesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/charts/types',
    });

    expect(typesResponse.statusCode).toBe(200);
    const typesBody = typesResponse.json();
    expect(typesBody.types.map((t: any) => t.value)).toEqual(
      expect.arrayContaining(['line', 'bar', 'pie', 'table', 'kpi']),
    );
  });
});

