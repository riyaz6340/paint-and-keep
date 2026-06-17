/**
 * Paint & Keep - CSRF Token Utilities
 *
 * Generates and validates CSRF tokens using the Web Crypto API
 * (Edge-compatible) and timing-safe comparison.
 *
 * Requirements: 26.7 (CSRF protection)
 */

/**
 * Generate a cryptographically secure CSRF token.
 * Returns a 64-character hex string (32 random bytes).
 * Uses Web Crypto API for Edge Runtime compatibility.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate a CSRF token against the stored token.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * Returns false if either token is missing or they don't match.
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }

  if (token.length !== storedToken.length) {
    return false;
  }

  // Constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  return mismatch === 0;
}
