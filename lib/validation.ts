/**
 * Paint & Keep - Input Validation Library
 *
 * Provides reusable validation functions for user input across
 * the storefront and admin dashboard. Each validator returns a
 * consistent { valid, error? } result object.
 *
 * Requirements: 13.1 (password), 4.6 (quantity), 26.6 (input validation)
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format against standard email regex.
 * Covers RFC 5322 simplified pattern.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email must not exceed 254 characters' };
  }

  // Standard email format: local@domain.tld
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate password strength.
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * Validate phone number in E.164 format.
 * E.164: + followed by 1-15 digits (country code + number).
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  // E.164 format: + followed by 1 to 15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!e164Regex.test(trimmed)) {
    return { valid: false, error: 'Phone must be in E.164 format (e.g., +919876543210)' };
  }

  return { valid: true };
}

/**
 * Validate name field: non-empty, max length.
 */
export function validateName(name: string, maxLength: number = 100): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Name must not exceed ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate price value: must be between 0.01 and 999999.99.
 */
export function validatePrice(price: number): ValidationResult {
  if (price === null || price === undefined || isNaN(price)) {
    return { valid: false, error: 'Price is required' };
  }

  if (price < 0.01) {
    return { valid: false, error: 'Price must be at least 0.01' };
  }

  if (price > 999999.99) {
    return { valid: false, error: 'Price must not exceed 999,999.99' };
  }

  return { valid: true };
}

/**
 * Validate quantity: must be an integer between 1 and 99.
 */
export function validateQuantity(quantity: number): ValidationResult {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return { valid: false, error: 'Quantity is required' };
  }

  if (!Number.isInteger(quantity)) {
    return { valid: false, error: 'Quantity must be a whole number' };
  }

  if (quantity < 1) {
    return { valid: false, error: 'Quantity must be at least 1' };
  }

  if (quantity > 99) {
    return { valid: false, error: 'Quantity must not exceed 99' };
  }

  return { valid: true };
}
