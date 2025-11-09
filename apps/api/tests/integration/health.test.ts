/**
 * Integration tests for health endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

describe('Integration :: Health Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/healthz should return ok status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/healthz',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toMatchObject({
      status: 'ok',
    });
    expect(body.timestamp).toBeDefined();
    expect(body.uptime).toBeGreaterThan(0);
  });

  it('GET /api/v1/livez should return alive status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/livez',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'alive' });
  });

  it('GET /api/v1/readyz should report dependencies status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/readyz',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.status).toBe('ready');
    expect(body.services.database).toBe('connected');
    expect(['connected', 'disconnected']).toContain(body.services.redis);
  });

  it('GET /api/v1/health should return detailed health data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.status).toBe('healthy');
    expect(body.services.database.status).toBe('connected');
    expect(['connected', 'disconnected']).toContain(body.services.redis.status);
    expect(body.system.memory.total).toBeGreaterThan(0);
    expect(body.system.cpu.count).toBeGreaterThan(0);
  });

  it('Unknown route should return RFC7807 error', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-route',
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();

    expect(body).toMatchObject({
      title: 'Not Found',
      status: 404,
    });
  });
});

