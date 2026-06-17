/**
 * Paint & Keep - Sanitization Utilities
 *
 * Provides XSS prevention through HTML entity encoding,
 * script tag stripping, and regex escaping.
 *
 * SQL injection is prevented at the ORM layer by Prisma's
 * parameterized queries — this module handles display-layer security.
 *
 * Requirements: 26.7 (XSS prevention, input sanitization)
 */

/**
 * HTML entity map for encoding dangerous characters.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Encode HTML entities to prevent XSS attacks.
 * Converts characters that could be interpreted as HTML/JS to their
 * safe entity equivalents.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize input for safe display in the browser.
 * Strips script tags and their content, then encodes remaining HTML entities.
 */
export function sanitizeForDisplay(input: string): string {
  if (!input) return '';

  // Remove script tags and their contents (case-insensitive, handles attributes)
  const withoutScripts = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  const withoutEvents = withoutScripts.replace(
    /\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ''
  );

  // Encode remaining HTML entities
  return sanitizeHtml(withoutEvents);
}

/**
 * Escape special regex characters in a string.
 * Useful when building dynamic regex patterns from user input.
 */
export function escapeRegExp(str: string): string {
  if (!str) return '';

  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
