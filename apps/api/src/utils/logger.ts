/**
 * Logger configuration using Pino
 * Provides structured logging with correlation IDs
 */

import pinoLogger, {
  stdSerializers,
  stdTimeFunctions,
  transport as createPinoTransport,
  type DestinationStream,
  type LoggerOptions,
  type TransportSingleOptions,
} from 'pino';

import { config } from '../config';

interface RequestLike extends Record<string, unknown> {
  id?: string | number;
  method?: string;
  url?: string;
  query?: unknown;
  params?: unknown;
  headers?: Record<string, unknown> | null;
  ip?: string;
  socket?: {
    remotePort?: unknown;
    } | null;
}

interface ResponseLike extends Record<string, unknown> {
  statusCode?: number;
  getHeaders?: () => unknown;
  headers?: Record<string, unknown> | null;
}

interface SerializedRequest {
  id?: string | number;
  method?: string;
  url?: string;
  query?: unknown;
  params?: unknown;
  headers: Record<string, unknown>;
  remoteAddress?: string;
  remotePort?: number;
}

interface SerializedResponse {
  statusCode?: number;
  headers: Record<string, unknown>;
}

const formatBindings = (bindings: unknown) => {
  if (!isRecord(bindings)) {
    return { node_version: process.version };
  }

  const pidRaw = bindings['pid'];
  const hostRaw = bindings['hostname'];
  const pid = typeof pidRaw === 'number' ? pidRaw : undefined;
  const host = typeof hostRaw === 'string' ? hostRaw : undefined;

  return {
    pid,
    host,
    node_version: process.version,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toRecord = <T extends Record<string, unknown>>(value: unknown): T | undefined =>
  isRecord(value) ? (value as T) : undefined;

const redactHeaders = (headers: Record<string, unknown> | undefined): Record<string, unknown> => {
  if (!headers) {
    return {};
  }

  const safeHeaders: Record<string, unknown> = { ...headers };

  if (typeof safeHeaders['authorization'] === 'string') {
    safeHeaders['authorization'] = '[REDACTED]';
  }

  return safeHeaders;
};

const serializeRequest = (req: unknown): SerializedRequest => {
  const request = toRecord<RequestLike>(req) ?? {};
  const headers = redactHeaders(toRecord<Record<string, unknown>>(request['headers']));
  const socket = toRecord<{ remotePort?: unknown }>(request['socket']);

  const serialized: SerializedRequest = {
    headers,
  };

  const requestId = request['id'];
  if (typeof requestId === 'string' || typeof requestId === 'number') {
    serialized.id = requestId;
  }

  const method = request['method'];
  if (typeof method === 'string') {
    serialized.method = method;
  }

  const url = request['url'];
  if (typeof url === 'string') {
    serialized.url = url;
  }

  if (request['query'] !== undefined) {
    serialized.query = request['query'];
  }

  if (request['params'] !== undefined) {
    serialized.params = request['params'];
  }

  const ip = request['ip'];
  if (typeof ip === 'string') {
    serialized.remoteAddress = ip;
  }

  const remotePort = socket?.remotePort;
  if (typeof remotePort === 'number') {
    serialized.remotePort = remotePort;
  }

  return serialized;
};

const serializeResponse = (res: unknown): SerializedResponse => {
  const response = toRecord<ResponseLike>(res);
  let resolvedHeaders: Record<string, unknown> = {};

  const headerCandidate = response?.['headers'];

  if (typeof response?.getHeaders === 'function') {
    const headers = response.getHeaders();
    if (isRecord(headers)) {
      resolvedHeaders = headers;
    }
  } else if (isRecord(headerCandidate)) {
    resolvedHeaders = headerCandidate;
  }

  const serialized: SerializedResponse = {
    headers: resolvedHeaders,
  };

  const statusCode = response?.['statusCode'];
  if (typeof statusCode === 'number') {
    serialized.statusCode = statusCode;
  }

  return serialized;
};

const loggerOptions: LoggerOptions = {
  level: config.logLevel,
  timestamp: stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: (bindings: unknown) => formatBindings(bindings),
  },
  serializers: {
    req: serializeRequest,
    res: serializeResponse,
    err: stdSerializers.err,
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
    version: process.env['npm_package_version'] ?? '1.0.0',
  },
};

// Add pretty printing in development
const transport =
  config.logPretty && config.env === 'development'
    ? ({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname,node_version',
          messageFormat: '{msg} {req.method} {req.url} {res.statusCode}',
        },
      } satisfies TransportSingleOptions)
    : undefined;

const destination: DestinationStream | undefined = transport
  ? (createPinoTransport(transport) as DestinationStream)
  : undefined;

// Create logger instance
export const logger = pinoLogger(loggerOptions, destination);

// Child logger factory for request context
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Export logger types
export type Logger = typeof logger;
