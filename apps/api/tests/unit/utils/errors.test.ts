/**
 * Unit tests for global error handler utilities
 */

import { describe, expect, it } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  ValidationError,
  errorHandler,
} from '../../../src/utils/errors.js';

const createReply = () => {
  const reply = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };

  return reply as unknown as FastifyReply & {
    payload: unknown;
  };
};

const createRequest = (overrides: Partial<FastifyRequest> = {}) => {
  const request = {
    id: 'req-1',
    method: 'GET',
    url: '/test',
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };

  return request as FastifyRequest;
};

describe('utils/errorHandler', () => {
  it('should serialise ValidationError responses', async () => {
    const error = new ValidationError('Invalid payload', { field: 'error' });
    const reply = createReply();

    await errorHandler(error, createRequest(), reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      title: 'Validation Error',
      detail: 'Invalid payload',
      status: 400,
      errors: { field: 'error' },
    });
  });

  it('should translate ZodError into validation response', async () => {
    const error = new ZodError([
      {
        path: ['body', 'field'],
        message: 'Required',
        code: 'custom',
      },
    ]);

    const reply = createReply();
    await errorHandler(error, createRequest(), reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      title: 'Validation Error',
      status: 400,
      errors: { 'body.field': 'Required' },
    });
  });

  it('should default to 500 on unknown errors', async () => {
    const reply = createReply();
    await errorHandler(new Error('Boom'), createRequest(), reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toMatchObject({
      title: 'Internal Server Error',
      status: 500,
    });
  });
});

