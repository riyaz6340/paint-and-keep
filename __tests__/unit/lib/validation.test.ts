import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validatePrice,
  validateQuantity,
} from '@/lib/validation';

describe('validateEmail', () => {
  it('returns valid for standard email', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });

  it('returns valid for email with subdomain', () => {
    expect(validateEmail('user@mail.example.co.uk')).toEqual({ valid: true });
  });

  it('returns error for empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('returns error for missing @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('returns error for missing domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  it('returns error for email exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(246) + '@test.com'; // 246 + 9 = 255 chars
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email must not exceed 254 characters');
  });

  it('trims whitespace before validation', () => {
    expect(validateEmail('  user@example.com  ')).toEqual({ valid: true });
  });
});

describe('validatePassword', () => {
  it('returns valid for strong password', () => {
    expect(validatePassword('MyP@ss1234')).toEqual({ valid: true });
  });

  it('returns error for empty password', () => {
    expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
  });

  it('returns error for short password', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('returns error for missing uppercase', () => {
    const result = validatePassword('myp@ss1234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('uppercase');
  });

  it('returns error for missing lowercase', () => {
    const result = validatePassword('MYP@SS1234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('returns error for missing digit', () => {
    const result = validatePassword('MyP@ssword');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('digit');
  });

  it('returns error for missing special character', () => {
    const result = validatePassword('MyPass1234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('special character');
  });
});

describe('validatePhone', () => {
  it('returns valid for E.164 format', () => {
    expect(validatePhone('+919876543210')).toEqual({ valid: true });
  });

  it('returns valid for US number', () => {
    expect(validatePhone('+12025551234')).toEqual({ valid: true });
  });

  it('returns error for empty phone', () => {
    const result = validatePhone('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Phone number is required');
  });

  it('returns error for missing plus sign', () => {
    const result = validatePhone('919876543210');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('E.164');
  });

  it('returns error for number starting with +0', () => {
    const result = validatePhone('+0123456789');
    expect(result.valid).toBe(false);
  });

  it('returns error for too many digits', () => {
    const result = validatePhone('+1234567890123456');
    expect(result.valid).toBe(false);
  });
});

describe('validateName', () => {
  it('returns valid for normal name', () => {
    expect(validateName('John Doe')).toEqual({ valid: true });
  });

  it('returns error for empty name', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('returns error for whitespace-only name', () => {
    const result = validateName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('returns error when exceeding default max length (100)', () => {
    const result = validateName('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100');
  });

  it('respects custom max length', () => {
    const result = validateName('a'.repeat(51), 50);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('50');
  });

  it('accepts name at exact max length', () => {
    expect(validateName('a'.repeat(100))).toEqual({ valid: true });
  });
});

describe('validatePrice', () => {
  it('returns valid for normal price', () => {
    expect(validatePrice(29.99)).toEqual({ valid: true });
  });

  it('returns valid for minimum price 0.01', () => {
    expect(validatePrice(0.01)).toEqual({ valid: true });
  });

  it('returns valid for maximum price', () => {
    expect(validatePrice(999999.99)).toEqual({ valid: true });
  });

  it('returns error for zero', () => {
    const result = validatePrice(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0.01');
  });

  it('returns error for negative price', () => {
    const result = validatePrice(-5);
    expect(result.valid).toBe(false);
  });

  it('returns error for price exceeding max', () => {
    const result = validatePrice(1000000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('999,999.99');
  });

  it('returns error for NaN', () => {
    const result = validatePrice(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Price is required');
  });
});

describe('validateQuantity', () => {
  it('returns valid for integer in range', () => {
    expect(validateQuantity(5)).toEqual({ valid: true });
  });

  it('returns valid for minimum quantity 1', () => {
    expect(validateQuantity(1)).toEqual({ valid: true });
  });

  it('returns valid for maximum quantity 99', () => {
    expect(validateQuantity(99)).toEqual({ valid: true });
  });

  it('returns error for zero', () => {
    const result = validateQuantity(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 1');
  });

  it('returns error for exceeding 99', () => {
    const result = validateQuantity(100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('99');
  });

  it('returns error for decimal', () => {
    const result = validateQuantity(2.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('whole number');
  });

  it('returns error for negative', () => {
    const result = validateQuantity(-1);
    expect(result.valid).toBe(false);
  });

  it('returns error for NaN', () => {
    const result = validateQuantity(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity is required');
  });
});
