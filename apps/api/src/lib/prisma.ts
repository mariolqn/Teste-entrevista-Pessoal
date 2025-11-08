/**
 * Prisma client singleton with connection management
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';

// Extend PrismaClient with middleware and logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Add logging middleware in development
if (config.env === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug({
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target,
    }, 'Prisma Query');
  });
}

// Log errors
prisma.$on('error' as never, (e: any) => {
  logger.error({
    message: e.message,
    target: e.target,
  }, 'Prisma Error');
});

// Log warnings
prisma.$on('warn' as never, (e: any) => {
  logger.warn({
    message: e.message,
    target: e.target,
  }, 'Prisma Warning');
});

// Log info
prisma.$on('info' as never, (e: any) => {
  logger.info({
    message: e.message,
    target: e.target,
  }, 'Prisma Info');
});

// Middleware for soft deletes (if needed)
prisma.$use(async (params, next) => {
  // Soft delete middleware can be added here
  const result = await next(params);
  return result;
});

// Middleware for query timing
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  if (config.env === 'development') {
    logger.debug({
      model: params.model,
      action: params.action,
      duration: `${after - before}ms`,
    }, 'Query execution time');
  }
  
  return result;
});

// Connection management
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error(error, '❌ Failed to connect to database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('👋 Database disconnected');
  } catch (error) {
    logger.error(error, '❌ Error disconnecting from database');
    throw error;
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

if (config.env !== 'production') globalThis.prisma = prisma;

export default prisma;
