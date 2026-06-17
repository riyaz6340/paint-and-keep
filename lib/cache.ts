/**
 * Paint & Keep - Cache Utility Library
 *
 * Type-safe Redis caching with JSON serialization, TTL support,
 * and pattern-based invalidation. Handles connection errors gracefully.
 */

import { getRedisClient } from './redis';

/** Default TTL: 60 seconds (matches ISR revalidation) */
const DEFAULT_TTL_SECONDS = 60;

/**
 * Get a cached value by key.
 * Returns null if the key doesn't exist or on error.
 *
 * @param key - The cache key
 * @returns The deserialized value or null
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);

    if (data === null) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[Cache] Error getting key "${key}":`, error);
    return null;
  }
}

/**
 * Set a cached value with optional TTL.
 *
 * @param key - The cache key
 * @param value - The value to cache (will be JSON-serialized)
 * @param ttlSeconds - Time to live in seconds (default: 60s)
 * @returns true if set successfully, false on error
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<boolean> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);

    if (ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }

    return true;
  } catch (error) {
    console.error(`[Cache] Error setting key "${key}":`, error);
    return false;
  }
}

/**
 * Invalidate (delete) a specific cache key.
 *
 * @param key - The cache key to invalidate
 * @returns true if deleted successfully, false on error
 */
export async function cacheInvalidate(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache] Error invalidating key "${key}":`, error);
    return false;
  }
}

/**
 * Invalidate all cache keys matching a pattern.
 * Uses Redis SCAN for production-safe iteration (non-blocking).
 *
 * @param pattern - A Redis glob pattern (e.g., "products:*", "category:animals:*")
 * @returns The number of keys invalidated, or -1 on error
 *
 * @example
 * // Invalidate all product cache entries
 * await cacheInvalidatePattern('products:*');
 *
 * // Invalidate all cache for a specific category
 * await cacheInvalidatePattern('category:animals:*');
 */
export async function cacheInvalidatePattern(
  pattern: string
): Promise<number> {
  try {
    const client = getRedisClient();
    let cursor = '0';
    let totalDeleted = 0;

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        const deleted = await client.del(...keys);
        totalDeleted += deleted;
      }
    } while (cursor !== '0');

    return totalDeleted;
  } catch (error) {
    console.error(
      `[Cache] Error invalidating pattern "${pattern}":`,
      error
    );
    return -1;
  }
}

/**
 * Get or set a cached value (cache-aside pattern).
 * If the key exists, returns the cached value.
 * If not, calls the factory function, caches the result, and returns it.
 *
 * @param key - The cache key
 * @param factory - Async function to produce the value if cache miss
 * @param ttlSeconds - Time to live in seconds (default: 60s)
 * @returns The cached or freshly computed value
 */
export async function cacheGetOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<T> {
  const cached = await cacheGet<T>(key);

  if (cached !== null) {
    return cached;
  }

  const value = await factory();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
