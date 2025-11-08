/**
 * Custom error classes and error handling utilities
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public statusCode: number;
  public type: string;
  public title: string;
  public detail?: string;
  public instance?: string;
  public errors?: Record<string, any>;

  constructor(
    statusCode: number,
    title: string,
    detail?: string,
    type?: string,
    errors?: Record<string, any>
  ) {
    super(detail || title);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.title = title;
    this.detail = detail;
    this.type = type || `https://api.dashboard.com/errors/${this.constructor.name}`;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      type: this.type,
      title: this.title,
      status: this.statusCode,
      detail: this.detail,
      errors: this.errors,
    };
  }
}

/**
 * Common API Errors
 */
export class ValidationError extends ApiError {
  constructor(detail: string, errors?: Record<string, any>) {
    super(
      400,
      'Validation Error',
      detail,
      'https://api.dashboard.com/errors/validation',
      errors
    );
  }
}

export class UnauthorizedError extends ApiError {
  constructor(detail: string = 'Authentication required') {
    super(
      401,
      'Unauthorized',
      detail,
      'https://api.dashboard.com/errors/unauthorized'
    );
  }
}

export class ForbiddenError extends ApiError {
  constructor(detail: string = 'Access denied') {
    super(
      403,
      'Forbidden',
      detail,
      'https://api.dashboard.com/errors/forbidden'
    );
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(
      404,
      'Not Found',
      `${resource} not found`,
      'https://api.dashboard.com/errors/not-found'
    );
  }
}

export class ConflictError extends ApiError {
  constructor(detail: string) {
    super(
      409,
      'Conflict',
      detail,
      'https://api.dashboard.com/errors/conflict'
    );
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(
      429,
      'Too Many Requests',
      'Rate limit exceeded. Please try again later.',
      'https://api.dashboard.com/errors/rate-limit',
      retryAfter ? { retryAfter } : undefined
    );
  }
}

export class InternalServerError extends ApiError {
  constructor(detail: string = 'An unexpected error occurred') {
    super(
      500,
      'Internal Server Error',
      detail,
      'https://api.dashboard.com/errors/internal'
    );
  }
}

/**
 * Error handler function
 */
export async function errorHandler(
  error: FastifyError | Error | any,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log the error with context
  logger.error({
    err: error,
    request: {
      id: request.id,
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      headers: {
        ...request.headers,
        authorization: undefined, // Redact sensitive data
      },
    },
  }, 'Request error');

  // Handle API errors
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      type: error.type,
      title: error.title,
      status: error.statusCode,
      detail: error.detail,
      instance: request.url,
      errors: error.errors,
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.errors.reduce((acc, err) => {
      const path = err.path.join('.');
      acc[path] = err.message;
      return acc;
    }, {} as Record<string, string>);

    return reply.status(400).send({
      type: 'https://api.dashboard.com/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: 'Request validation failed',
      instance: request.url,
      errors,
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return reply.status(409).send({
          type: 'https://api.dashboard.com/errors/conflict',
          title: 'Conflict',
          status: 409,
          detail: 'Resource already exists',
          instance: request.url,
        });
      
      case 'P2025':
        return reply.status(404).send({
          type: 'https://api.dashboard.com/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Resource not found',
          instance: request.url,
        });
      
      case 'P2003':
        return reply.status(400).send({
          type: 'https://api.dashboard.com/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Foreign key constraint failed',
          instance: request.url,
        });
      
      default:
        return reply.status(500).send({
          type: 'https://api.dashboard.com/errors/database',
          title: 'Database Error',
          status: 500,
          detail: 'A database error occurred',
          instance: request.url,
        });
    }
  }

  // Handle Fastify errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return reply.status(error.statusCode).send({
      type: 'https://api.dashboard.com/errors/http',
      title: error.name || 'Error',
      status: error.statusCode,
      detail: error.message,
      instance: request.url,
    });
  }

  // Default to 500
  return reply.status(500).send({
    type: 'https://api.dashboard.com/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: request.url,
  });
}

/**
 * Not found handler
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return reply.status(404).send({
    type: 'https://api.dashboard.com/errors/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Route ${request.method} ${request.url} not found`,
    instance: request.url,
  });
}
