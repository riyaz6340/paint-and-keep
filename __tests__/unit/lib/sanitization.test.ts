import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeForDisplay, escapeRegExp } from '@/lib/sanitization';

describe('sanitizeHtml', () => {
  it('encodes angle brackets', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('encodes ampersands', () => {
    expect(sanitizeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('encodes quotes', () => {
    expect(sanitizeHtml('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#x27;world&#x27;');
  });

  it('encodes backticks', () => {
    expect(sanitizeHtml('`test`')).toBe('&#96;test&#96;');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeHtml(null as unknown as string)).toBe('');
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });

  it('does not modify safe text', () => {
    expect(sanitizeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('sanitizeForDisplay', () => {
  it('removes script tags and their content', () => {
    expect(sanitizeForDisplay('Hello<script>alert("xss")</script>World')).toBe(
      'HelloWorld'
    );
  });

  it('removes script tags with attributes', () => {
    expect(sanitizeForDisplay('<script type="text/javascript">evil()</script>Safe')).toBe(
      'Safe'
    );
  });

  it('removes event handler attributes', () => {
    const result = sanitizeForDisplay('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain('onerror');
  });

  it('encodes remaining HTML entities', () => {
    const result = sanitizeForDisplay('<b>Bold</b>');
    expect(result).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt;');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeForDisplay('')).toBe('');
  });

  it('handles multiple script tags', () => {
    const input = '<script>a()</script>Hello<script>b()</script>';
    expect(sanitizeForDisplay(input)).toBe('Hello');
  });
});

describe('escapeRegExp', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegExp('hello.world')).toBe('hello\\.world');
    expect(escapeRegExp('a*b+c?')).toBe('a\\*b\\+c\\?');
    expect(escapeRegExp('[test]')).toBe('\\[test\\]');
    expect(escapeRegExp('(group)')).toBe('\\(group\\)');
    expect(escapeRegExp('{1,2}')).toBe('\\{1,2\\}');
    expect(escapeRegExp('a|b')).toBe('a\\|b');
    expect(escapeRegExp('^start$end')).toBe('\\^start\\$end');
    expect(escapeRegExp('path\\to')).toBe('path\\\\to');
  });

  it('returns empty string for empty input', () => {
    expect(escapeRegExp('')).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeRegExp(null as unknown as string)).toBe('');
  });

  it('does not escape non-special characters', () => {
    expect(escapeRegExp('hello world')).toBe('hello world');
  });
});
