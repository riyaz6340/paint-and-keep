import { vi } from 'vitest';

export interface MockRedisClient {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  expire: ReturnType<typeof vi.fn>;
  ttl: ReturnType<typeof vi.fn>;
  incr: ReturnType<typeof vi.fn>;
  decr: ReturnType<typeof vi.fn>;
  hget: ReturnType<typeof vi.fn>;
  hset: ReturnType<typeof vi.fn>;
  hdel: ReturnType<typeof vi.fn>;
  hgetall: ReturnType<typeof vi.fn>;
  lpush: ReturnType<typeof vi.fn>;
  rpush: ReturnType<typeof vi.fn>;
  lrange: ReturnType<typeof vi.fn>;
  sadd: ReturnType<typeof vi.fn>;
  srem: ReturnType<typeof vi.fn>;
  smembers: ReturnType<typeof vi.fn>;
  sismember: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  keys: ReturnType<typeof vi.fn>;
  flushall: ReturnType<typeof vi.fn>;
  pipeline: ReturnType<typeof vi.fn>;
  multi: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

/**
 * In-memory store for simulating Redis behavior in tests.
 */
const store = new Map<string, string>();

export function createRedisMock(): MockRedisClient {
  const redisMock: MockRedisClient = {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    }),
    expire: vi.fn(async () => 1),
    ttl: vi.fn(async () => -1),
    incr: vi.fn(async (key: string) => {
      const current = parseInt(store.get(key) || '0', 10);
      const next = current + 1;
      store.set(key, String(next));
      return next;
    }),
    decr: vi.fn(async (key: string) => {
      const current = parseInt(store.get(key) || '0', 10);
      const next = current - 1;
      store.set(key, String(next));
      return next;
    }),
    hget: vi.fn(async () => null),
    hset: vi.fn(async () => 1),
    hdel: vi.fn(async () => 1),
    hgetall: vi.fn(async () => ({})),
    lpush: vi.fn(async () => 1),
    rpush: vi.fn(async () => 1),
    lrange: vi.fn(async () => []),
    sadd: vi.fn(async () => 1),
    srem: vi.fn(async () => 1),
    smembers: vi.fn(async () => []),
    sismember: vi.fn(async () => 0),
    exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    keys: vi.fn(async () => Array.from(store.keys())),
    flushall: vi.fn(async () => {
      store.clear();
      return 'OK';
    }),
    pipeline: vi.fn(() => ({
      exec: vi.fn(async () => []),
    })),
    multi: vi.fn(() => ({
      exec: vi.fn(async () => []),
    })),
    exec: vi.fn(async () => []),
    quit: vi.fn(async () => 'OK'),
    disconnect: vi.fn(),
  };

  return redisMock;
}

/**
 * Singleton mock instance for use across tests.
 */
export const redisMock = createRedisMock();

/**
 * Clear the in-memory store and reset all mock call history.
 */
export function resetRedisMock(): void {
  store.clear();
  Object.values(redisMock).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      (fn as ReturnType<typeof vi.fn>).mockClear();
    }
  });
}

vi.mock('@/lib/redis', () => ({
  __esModule: true,
  default: redisMock,
  redis: redisMock,
  getRedis: () => redisMock,
}));
