/**
 * Paint & Keep - Redis-Based Rate Limiting
 *
 * Implements a sliding window rate limiter using Redis.
 * Configurable per-endpoint with customizable request limits
 * and time windows. Returns 429 with Retry-After header when exceeded.
 *
 * Requirements: 26.6 (rate limiting), 26.8 (Redis)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from './redis';
import { type ApiErrorResponse } from './api-error';

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSizeSeconds: number;
  /** Prefix for Redis keys (defaults to 'rl') */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Seconds until the window resets */
  retryAfter: number;
  /** Total limit for the window */
  limit: number;
}

/**
 * Extract a client identifier from the request for rate limiting.
 * Uses X-Forwarded-For header (for proxied requests) or falls back
 * to a generic identifier.
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback — in production, X-Forwarded-For should always be present behind a proxy
  return 'unknown';
}

/**
 * Check rate limit for a given identifier using Redis sliding window.
 */
async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowSizeSeconds, keyPrefix = 'rl' } = options;
  const redis = getRedisClient();
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSizeSeconds * 1000;

  try {
    // Use a Redis pipeline for atomicity
    const pipeline = redis.pipeline();

    // Remove entries outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current entries in the window
    pipeline.zcard(key);

    // Add the current request
    pipeline.zadd(key, now.toString(), `${now}:${Math.random().toString(36).slice(2)}`);

    // Set expiry on the key to auto-cleanup
    pipeline.expire(key, windowSizeSeconds);

    const results = await pipeline.exec();

    // zcard result is at index 1 (0-indexed pipeline results)
    const currentCount = (results?.[1]?.[1] as number) || 0;

    const allowed = currentCount < maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0));
    const retryAfter = allowed ? 0 : windowSizeSeconds;

    return {
      allowed,
      remaining,
      retryAfter,
      limit: maxRequests,
    };
  } catch (error) {
    // If Redis is unavailable, allow the request (fail open)
    console.error('[Rate Limit] Redis error, allowing request:', error);
    return {
      allowed: true,
      remaining: maxRequests,
      retryAfter: 0,
      limit: maxRequests,
    };
  }
}

/**
 * Create a rate limiting middleware function with the given options.
 *
 * Usage in API routes:
 * ```ts
 * const limiter = createRateLimiter({ maxRequests: 10, windowSizeSeconds: 60 });
 *
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await limiter(request);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ... handle request
 * }
 * ```
 */
export function createRateLimiter(options: RateLimitOptions) {
  return async function rateLimitMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const identifier = getClientIdentifier(request);
    const result = await checkRateLimit(identifier, options);

    if (!result.allowed) {
      const errorBody: ApiErrorResponse = {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        details: { retryAfter: result.retryAfter },
        retryable: true,
      };

      return NextResponse.json(errorBody, {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    // Request is allowed — return null to continue processing
    return null;
  };
}
