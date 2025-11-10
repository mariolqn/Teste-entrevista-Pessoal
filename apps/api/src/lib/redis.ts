/**
 * Redis client for caching and session management
 */

import Redis, { type RedisOptions } from 'ioredis';

import { config } from '../config';
import { logger } from '../utils/logger';

// Create Redis client
const createRedisClient = () => {
  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (retryCount) => {
      if (retryCount > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }

      return Math.min(retryCount * 50, 2000);
    },
    reconnectOnError: (error) => error.message.includes('READONLY'),
    lazyConnect: true,
  } satisfies RedisOptions);

  // Event handlers
  client.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  client.on('ready', () => {
    logger.info('✅ Redis ready to accept commands');
  });

  client.on('error', (error) => {
    logger.error({ err: error }, '❌ Redis error');
  });

  client.on('close', () => {
    logger.info('👋 Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('🔄 Reconnecting to Redis...');
  });

  return client;
};

// Create singleton instance lazily
let _redisInstance: Redis | null = null;

export function getRedisInstance(): Redis | null {
  // In test mode, always return null to avoid Redis connection attempts
  if (process.env['NODE_ENV'] === 'test' || !config.featureCacheEnabled) {
    return null;
  }
  
  if (!_redisInstance) {
    _redisInstance = createRedisClient();
  }
  
  return _redisInstance;
}

// Export singleton - null in test mode to avoid connection attempts
export const redis = process.env['NODE_ENV'] === 'test' ? null : getRedisInstance();

// Cache utilities
export class CacheService {
  private readonly prefix: string;

  constructor(prefix: string = config.redisKeyPrefix) {
    this.prefix = prefix.endsWith(':') ? prefix : `${prefix}:`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const redisClient = getRedisInstance();
    if (!redisClient) {
      return null; // Return null when caching is disabled
    }
    
    try {
      const value = await redisClient.get(this.prefix + key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number = config.redisTtl): Promise<boolean> {
    const redisClient = getRedisInstance();
    if (!redisClient) {
      return true; // Return success when caching is disabled
    }
    
    try {
      const serialized = JSON.stringify(value);
      await (ttl > 0
        ? redisClient.setex(this.prefix + key, ttl, serialized)
        : redisClient.set(this.prefix + key, serialized));
      return true;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache set error');
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    const redisClient = getRedisInstance();
    if (!redisClient) {
      return true; // Return success when caching is disabled
    }
    
    try {
      const result = await redisClient.del(this.prefix + key);
      return result === 1;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    const redisClient = getRedisInstance();
    if (!redisClient) {
      return 0; // Return 0 when caching is disabled
    }
    
    try {
      const keys = await redisClient.keys(this.prefix + pattern);
      if (keys.length === 0) {
        return 0;
      }

      const pipeline = redisClient.pipeline();
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();

      return keys.length;
    } catch (error) {
      logger.error({ err: error, pattern }, 'Cache delete by pattern error');
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const redisClient = getRedisInstance();
    if (!redisClient) {
      return false; // Return false when caching is disabled
    }
    
    try {
      const result = await redisClient.exists(this.prefix + key);
      return result === 1;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache exists check error');
      return false;
    }
  }

  /**
   * Get or set value with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = config.redisTtl,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug({ key }, 'Cache hit');
      return cached;
    }

    // Cache miss, get fresh value
    logger.debug({ key }, 'Cache miss');
    const fresh = await factory();

    // Store in cache
    await this.set<T>(key, fresh, ttl);

    return fresh;
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    const redisClient = getRedisInstance();
    if (!redisClient) {
      return true; // Return success when caching is disabled
    }
    
    try {
      const keys = await redisClient.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        const pipeline = redisClient.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
      logger.info({ keyCount: keys.length }, 'Flushed cache entries');
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Cache flush error');
      return false;
    }
  }
}

// Export singleton cache service
export const cacheService = new CacheService(config.redisKeyPrefix);

// Connection management
export async function connectRedis(): Promise<void> {
  if (process.env['NODE_ENV'] === 'test' || !config.featureCacheEnabled) {
    logger.info('⏭️  Redis caching is disabled');
    return;
  }

  const redisClient = getRedisInstance();
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to connect to Redis');
    // Don't throw - Redis is optional for the app to work
    if (config.env === 'production') {
      throw error;
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  const redisClient = getRedisInstance();
  if (!redisClient) {
    return;
  }
  
  try {
    await redisClient.quit();
  } catch (error) {
    logger.error({ err: error }, '❌ Error disconnecting from Redis');
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  const redisClient = getRedisInstance();
  if (!redisClient) {
    return false; // Report as unhealthy when disabled
  }
  
  try {
    const result = await redisClient.ping();
    return typeof result === 'string' && result.toUpperCase() === 'PONG';
  } catch {
    return false;
  }
}
