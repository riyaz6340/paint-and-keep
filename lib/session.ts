/**
 * Paint & Keep - Session Store (Redis-backed)
 *
 * Manages user sessions with cryptographically random tokens,
 * sliding expiration (30-minute inactivity timeout), and
 * atomic session operations.
 */

import { randomBytes } from 'crypto';

import { getRedisClient } from './redis';

/** Session inactivity timeout: 30 minutes */
const SESSION_TTL_SECONDS = 30 * 60;

/** Redis key prefix for sessions */
const SESSION_PREFIX = 'session:';

/** Length of the session token in bytes (produces 64 hex chars) */
const TOKEN_BYTES = 32;

export interface SessionData {
  userId: string;
  role: 'customer' | 'admin' | 'super_admin' | 'operations' | 'marketing' | 'customer_support';
  email: string;
  createdAt: number;
  lastAccessedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Generate a cryptographically random session token.
 */
function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

/**
 * Build the Redis key for a session token.
 */
function sessionKey(token: string): string {
  return `${SESSION_PREFIX}${token}`;
}

/**
 * Create a new session for a user.
 * Generates a unique token, stores session data in Redis with TTL.
 *
 * @param data - The session data (userId, role, email, optional metadata)
 * @returns The generated session token, or null on error
 */
export async function createSession(
  data: Omit<SessionData, 'createdAt' | 'lastAccessedAt'>
): Promise<string | null> {
  try {
    const client = getRedisClient();
    const token = generateSessionToken();
    const now = Date.now();

    const session: SessionData = {
      ...data,
      createdAt: now,
      lastAccessedAt: now,
    };

    const key = sessionKey(token);
    const serialized = JSON.stringify(session);

    // Atomic set with TTL
    await client.setex(key, SESSION_TTL_SECONDS, serialized);

    return token;
  } catch (error) {
    console.error('[Session] Error creating session:', error);
    return null;
  }
}

/**
 * Validate a session token and return session data.
 * Refreshes the TTL on each valid access (sliding expiration).
 *
 * @param token - The session token to validate
 * @returns The session data if valid, or null if expired/invalid
 */
export async function validateSession(
  token: string
): Promise<SessionData | null> {
  try {
    const client = getRedisClient();
    const key = sessionKey(token);

    const data = await client.get(key);

    if (data === null) {
      return null;
    }

    const session = JSON.parse(data) as SessionData;

    // Refresh TTL (sliding expiration) and update lastAccessedAt
    session.lastAccessedAt = Date.now();
    const updatedData = JSON.stringify(session);

    // Atomic update: set new data with refreshed TTL
    await client.setex(key, SESSION_TTL_SECONDS, updatedData);

    return session;
  } catch (error) {
    console.error('[Session] Error validating session:', error);
    return null;
  }
}

/**
 * Refresh the session TTL without modifying session data.
 * Useful for lightweight activity heartbeats.
 *
 * @param token - The session token to refresh
 * @returns true if TTL was refreshed, false if session doesn't exist or error
 */
export async function refreshSession(token: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const key = sessionKey(token);

    // EXPIRE returns 1 if key exists and TTL was set, 0 otherwise
    const result = await client.expire(key, SESSION_TTL_SECONDS);
    return result === 1;
  } catch (error) {
    console.error('[Session] Error refreshing session:', error);
    return false;
  }
}

/**
 * Destroy a session (logout).
 *
 * @param token - The session token to destroy
 * @returns true if session was destroyed, false on error
 */
export async function destroySession(token: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const key = sessionKey(token);

    await client.del(key);
    return true;
  } catch (error) {
    console.error('[Session] Error destroying session:', error);
    return false;
  }
}

/**
 * Destroy all sessions for a specific user.
 * Uses SCAN to find and delete all session keys for the user.
 *
 * @param userId - The user ID whose sessions should be destroyed
 * @returns The number of sessions destroyed, or -1 on error
 */
export async function destroyAllUserSessions(
  userId: string
): Promise<number> {
  try {
    const client = getRedisClient();
    let cursor = '0';
    let totalDestroyed = 0;

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        `${SESSION_PREFIX}*`,
        'COUNT',
        100
      );
      cursor = nextCursor;

      for (const key of keys) {
        const data = await client.get(key);
        if (data) {
          const session = JSON.parse(data) as SessionData;
          if (session.userId === userId) {
            await client.del(key);
            totalDestroyed++;
          }
        }
      }
    } while (cursor !== '0');

    return totalDestroyed;
  } catch (error) {
    console.error('[Session] Error destroying user sessions:', error);
    return -1;
  }
}

/**
 * Get the remaining TTL for a session in seconds.
 *
 * @param token - The session token
 * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist, or null on error
 */
export async function getSessionTTL(token: string): Promise<number | null> {
  try {
    const client = getRedisClient();
    const key = sessionKey(token);
    return await client.ttl(key);
  } catch (error) {
    console.error('[Session] Error getting session TTL:', error);
    return null;
  }
}
