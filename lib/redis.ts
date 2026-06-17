/**
 * Paint & Keep - Redis Client Singleton
 *
 * Provides a shared Redis connection for caching, session management,
 * and guest cart persistence. Uses ioredis with automatic reconnection
 * and graceful error handling.
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get the singleton Redis client instance.
 * Creates the connection on first call and reuses it for subsequent calls.
 * Handles connection errors gracefully without crashing the application.
 */
export function getRedisClient(): Redis {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      // Exponential backoff: 200ms, 400ms, 800ms... max 5 seconds
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    reconnectOnError(err: Error) {
      // Reconnect on READONLY errors (e.g., Redis failover)
      const targetErrors = ['READONLY'];
      if (targetErrors.some((e) => err.message.includes(e))) {
        return true;
      }
      return false;
    },
    lazyConnect: false,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redis.on('ready', () => {
    console.log('[Redis] Ready to accept commands');
  });

  redis.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
    // Don't crash the app on Redis errors — degrade gracefully
  });

  redis.on('close', () => {
    console.warn('[Redis] Connection closed');
  });

  redis.on('reconnecting', (delay: number) => {
    console.log(`[Redis] Reconnecting in ${delay}ms...`);
  });

  return redis;
}

/**
 * Disconnect the Redis client gracefully.
 * Call this during application shutdown.
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Disconnected');
  }
}

/**
 * Check if Redis is currently connected and responsive.
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const response = await client.ping();
    return response === 'PONG';
  } catch {
    return false;
  }
}
