import Redis, { RedisOptions } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisInstance(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff up to 2 seconds
      const delay = Math.min(times * 100, 2000);
      return delay;
    },
    enableOfflineQueue: true,
    lazyConnect: false,
  };

  const client = new Redis(redisUrl, options);

  client.on('error', (err) => {
    // Prevent unhandled error crashes when Redis is disconnected
    console.warn('[Redis] Connection warning/error:', err.message || err);
  });

  client.on('connect', () => {
    console.log('[Redis] Successfully connected to Redis instance');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisInstance();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Get cached item parsed as JSON or fallback type
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(`[Redis] Failed to get key "${key}":`, error);
    return null;
  }
}

/**
 * Set cache item with optional expiration TTL in seconds
 */
export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.warn(`[Redis] Failed to set key "${key}":`, error);
  }
}

/**
 * Delete key(s) from cache
 */
export async function delCache(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`[Redis] Failed to delete keys:`, error);
  }
}

/**
 * Invalidate all keys matching pattern (e.g. "competition:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`[Redis] Failed to invalidate pattern "${pattern}":`, error);
  }
}

/**
 * Health check utility
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const ping = await redis.ping();
    return ping === 'PONG';
  } catch {
    return false;
  }
}

export default redis;
