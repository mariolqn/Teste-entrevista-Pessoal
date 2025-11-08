/**
 * Logger configuration using Pino
 * Provides structured logging with correlation IDs
 */

import pino from 'pino';
import { config } from '../config';

// Create base logger configuration
const loggerOptions: pino.LoggerOptions = {
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings['pid'],
        host: bindings['hostname'],
        node_version: process.version,
      };
    },
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      },
      remoteAddress: req.ip,
      remotePort: req.socket?.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders?.() || res.headers,
    }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'secret',
      'apiKey',
      'api_key',
      '*.password',
      '*.token',
      '*.authorization',
      '*.cookie',
      '*.secret',
      '*.apiKey',
      '*.api_key',
      'headers.authorization',
      'headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  base: {
    env: config.env,
    service: 'dashboard-api',
    version: process.env['npm_package_version'] || '1.0.0',
  },
};

// Add pretty printing in development
const transport = config.logPretty && config.env === 'development'
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname,node_version',
        messageFormat: '{msg} {req.method} {req.url} {res.statusCode}',
      },
    }
  : undefined;

// Create logger instance
export const logger = pino(
  loggerOptions,
  transport ? pino.transport(transport) : undefined
);

// Child logger factory for request context
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Export logger types
export type Logger = typeof logger;
