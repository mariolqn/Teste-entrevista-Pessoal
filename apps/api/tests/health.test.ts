/**
 * Health endpoint tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Health Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/healthz', () => {
    it('should return 200 with status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/healthz',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeDefined();
      expect(body.version).toBeDefined();
    });
  });

  describe('GET /api/v1/livez', () => {
    it('should return 200 with alive status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/livez',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('alive');
    });
  });

  describe('GET /api/v1/readyz', () => {
    it('should return service status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/readyz',
      });

      const body = JSON.parse(response.body);
      expect(body.status).toBeDefined();
      expect(body.services).toBeDefined();
      expect(body.services.database).toBeDefined();
      expect(body.services.redis).toBeDefined();
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return detailed health information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.services).toBeDefined();
      expect(body.system).toBeDefined();
      expect(body.system.memory).toBeDefined();
      expect(body.system.cpu).toBeDefined();
      expect(body.system.process).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/unknown',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.type).toBeDefined();
      expect(body.title).toBe('Not Found');
      expect(body.status).toBe(404);
    });
  });
});
