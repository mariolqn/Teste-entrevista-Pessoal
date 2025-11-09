/**
 * Integration tests for dashboard summary endpoint
 */

import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

function getDateRange(daysBack = 120, daysForward = 30) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  const end = new Date(now);
  end.setDate(end.getDate() + daysForward);
  const format = (date: Date) => date.toISOString().split('T')[0]!;
  return { start: format(start), end: format(end) };
}

describe('Integration :: Dashboard Summary', () => {
  let app: FastifyInstance;
  const { start, end } = getDateRange();

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should require start and end query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.message ?? body.detail ?? '').toContain('start');
  });

  it('should return KPI summary with expected totals', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      query: { start, end },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.totalRevenue).toBeGreaterThan(0);
    expect(body.totalExpense).toBeGreaterThan(0);
    expect(body.liquidProfit).toBeCloseTo(body.totalRevenue - body.totalExpense, 2);

    expect(body.overdueAccounts.receivable).toBeCloseTo(7500, 2);
    expect(body.overdueAccounts.payable).toBeCloseTo(34853, 2);
    expect(body.overdueAccounts.total).toBeCloseTo(7500 + 34853, 2);

    expect(body.upcomingAccounts.receivable).toBeGreaterThanOrEqual(0);
    expect(body.upcomingAccounts.payable).toBeGreaterThanOrEqual(0);
    expect(body.metadata.period.start).toBeDefined();
    expect(body.metadata.period.end).toBeDefined();
  });

  it('should support filtering by category', async () => {
    // Fetch categories through options endpoint to get a valid ID
    const categoriesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/options/categories',
      query: { limit: '1' },
    });

    const categoryId = categoriesResponse.json().items[0].id as string;
    const baselineResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      query: { start, end },
    });
    const baseline = baselineResponse.json();

    const filtered = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      query: { start, end, categoryId },
    });

    expect(filtered.statusCode).toBe(200);
    const body = filtered.json();
    expect(body.totalRevenue).toBeLessThanOrEqual(baseline.totalRevenue);
    expect(body.totalExpense).toBeLessThanOrEqual(baseline.totalExpense);
  });

  it('should support filtering by product', async () => {
    const productsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/options/products',
      query: { limit: '1' },
    });
    const productId = productsResponse.json().items[0].id as string;

    const filtered = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      query: { start, end, productId },
    });

    expect(filtered.statusCode).toBe(200);
    const body = filtered.json();
    expect(body.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(body.totalExpense).toBeGreaterThanOrEqual(0);
  });

  it('should support filtering by region', async () => {
    const regionsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/options/regions',
      query: { limit: '1' },
    });

    const region = regionsResponse.json().items[0].value as string;

    const filtered = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      query: { start, end, region },
    });

    expect(filtered.statusCode).toBe(200);
    const body = filtered.json();
    expect(body.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(body.totalExpense).toBeGreaterThanOrEqual(0);
  });
});

