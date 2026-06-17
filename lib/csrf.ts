/**
 * Paint & Keep - CSRF Token Utilities
 *
 * Generates and validates CSRF tokens using cryptographically
 * secure random bytes and timing-safe comparison to prevent
 * timing attacks.
 *
 * Requirements: 26.7 (CSRF protection)
 */

import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * Generate a cryptographically secure CSRF token.
 * Returns a 64-character hex string (32 random bytes).
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token against the stored token using
 * timing-safe comparison to prevent timing attacks.
 *
 * Returns false if either token is missing or they don't match.
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }

  // Tokens must be the same length for timingSafeEqual
  if (token.length !== storedToken.length) {
    return false;
  }

  try {
    const tokenBuffer = Buffer.from(token, 'utf-8');
    const storedBuffer = Buffer.from(storedToken, 'utf-8');

    return timingSafeEqual(tokenBuffer, storedBuffer);
  } catch {
    return false;
  }
}
