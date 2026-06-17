import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

function createMockRequest(ip: string = '127.0.0.1'): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    headers: {
      'x-forwarded-for': ip,
    },
  });
}

describe('createRateLimiter - allows requests', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns a function', async () => {
    vi.doMock('@/lib/redis', () => ({
      getRedisClient: () => ({
        pipeline: () => ({
          zremrangebyscore: vi.fn().mockReturnThis(),
          zcard: vi.fn().mockReturnThis(),
          zadd: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue([
            [null, 0],
            [null, 0],
            [null, 1],
            [null, 1],
          ]),
        }),
      }),
    }));

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter({ maxRequests: 10, windowSizeSeconds: 60 });
    expect(typeof limiter).toBe('function');
  });

  it('allows requests within the limit', async () => {
    vi.doMock('@/lib/redis', () => ({
      getRedisClient: () => ({
        pipeline: () => ({
          zremrangebyscore: vi.fn().mockReturnThis(),
          zcard: vi.fn().mockReturnThis(),
          zadd: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue([
            [null, 0],
            [null, 3], // 3 existing requests, limit is 10
            [null, 1],
            [null, 1],
          ]),
        }),
      }),
    }));

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter({ maxRequests: 10, windowSizeSeconds: 60 });
    const request = createMockRequest();

    const result = await limiter(request);
    expect(result).toBeNull();
  });
});

describe('createRateLimiter - rate exceeded', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('blocks requests when limit is exceeded', async () => {
    vi.doMock('@/lib/redis', () => ({
      getRedisClient: () => ({
        pipeline: () => ({
          zremrangebyscore: vi.fn().mockReturnThis(),
          zcard: vi.fn().mockReturnThis(),
          zadd: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue([
            [null, 0],
            [null, 10], // already at limit of 10
            [null, 1],
            [null, 1],
          ]),
        }),
      }),
    }));

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter({ maxRequests: 10, windowSizeSeconds: 60 });
    const request = createMockRequest();

    const result = await limiter(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);

    const body = await result!.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.retryable).toBe(true);
  });

  it('includes Retry-After header when rate limited', async () => {
    vi.doMock('@/lib/redis', () => ({
      getRedisClient: () => ({
        pipeline: () => ({
          zremrangebyscore: vi.fn().mockReturnThis(),
          zcard: vi.fn().mockReturnThis(),
          zadd: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue([
            [null, 0],
            [null, 5], // at limit of 5
            [null, 1],
            [null, 1],
          ]),
        }),
      }),
    }));

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter({ maxRequests: 5, windowSizeSeconds: 30 });
    const request = createMockRequest();

    const result = await limiter(request);
    expect(result).not.toBeNull();
    expect(result!.headers.get('Retry-After')).toBe('30');
    expect(result!.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});

describe('createRateLimiter - Redis failure', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('allows requests when Redis is unavailable (fail open)', async () => {
    vi.doMock('@/lib/redis', () => ({
      getRedisClient: () => ({
        pipeline: () => ({
          zremrangebyscore: vi.fn().mockReturnThis(),
          zcard: vi.fn().mockReturnThis(),
          zadd: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        }),
      }),
    }));

    const { createRateLimiter } = await import('@/lib/rate-limit');
    const limiter = createRateLimiter({ maxRequests: 10, windowSizeSeconds: 60 });
    const request = createMockRequest();

    const result = await limiter(request);
    expect(result).toBeNull();
  });
});
