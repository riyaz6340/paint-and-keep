import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';

describe('generateCsrfToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
  });

  it('generates unique tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(100);
  });
});

describe('validateCsrfToken', () => {
  it('returns true for matching tokens', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, token)).toBe(true);
  });

  it('returns false for non-matching tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();
    expect(validateCsrfToken(token1, token2)).toBe(false);
  });

  it('returns false for empty token', () => {
    const stored = generateCsrfToken();
    expect(validateCsrfToken('', stored)).toBe(false);
  });

  it('returns false for empty stored token', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, '')).toBe(false);
  });

  it('returns false for tokens of different lengths', () => {
    expect(validateCsrfToken('short', 'muchlongertoken')).toBe(false);
  });

  it('is timing-safe (does not short-circuit)', () => {
    const token = generateCsrfToken();
    // Tamper with just the last character
    const tampered = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');
    expect(validateCsrfToken(tampered, token)).toBe(false);
  });
});
