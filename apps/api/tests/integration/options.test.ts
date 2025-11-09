/**
 * Integration tests for options endpoints (infinite scroll sources)
 */

import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

describe('Integration :: Options Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return paginated categories with next cursor', async () => {
    const firstPage = await app.inject({
      method: 'GET',
      url: '/api/v1/options/categories',
      query: {
        limit: '2',
      },
    });

    expect(firstPage.statusCode).toBe(200);
    const firstBody = firstPage.json();

    expect(firstBody.items).toHaveLength(2);
    expect(firstBody.hasMore).toBe(true);
    expect(firstBody.nextCursor).toBeDefined();

    const secondPage = await app.inject({
      method: 'GET',
      url: '/api/v1/options/categories',
      query: {
        limit: '2',
        cursor: firstBody.nextCursor,
      },
    });

    expect(secondPage.statusCode).toBe(200);
    const secondBody = secondPage.json();
    expect(secondBody.items.length).toBeGreaterThan(0);

    const firstIds = firstBody.items.map((item: any) => item.id);
    secondBody.items.forEach((item: any) => {
      expect(firstIds).not.toContain(item.id);
    });
  });

  it('should support fuzzy search across entities', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/options/customers',
      query: {
        q: 'Suzano',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.items.length).toBeGreaterThan(0);
    body.items.forEach((item: any) => {
      expect(item.label.toLowerCase()).toContain('suzano');
    });
  });

  it('should return distinct regions with metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/options/regions',
      query: {
        limit: '5',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.items.length).toBeGreaterThan(0);
    body.items.forEach((item: any) => {
      expect(item.metadata?.customerCount).toBeGreaterThan(0);
    });
  });

  it('should return validation error for malformed cursor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/options/categories',
      query: {
        cursor: 'not-a-valid-cursor',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.title).toBe('Validation Error');
    expect(body.detail).toContain('Invalid cursor');
  });
});

