/**
 * Paint & Keep - Next.js Middleware
 *
 * Handles CSRF validation on state-changing requests (POST, PUT, PATCH, DELETE).
 * Generates and attaches CSRF tokens to responses for client consumption.
 *
 * Requirements: 26.7 (CSRF protection)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';

/** HTTP methods that modify state and require CSRF protection */
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** Paths excluded from CSRF validation (e.g., webhook endpoints, JSON API routes) */
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/',
  '/api/health',
  '/api/cart',
  '/api/products',
  '/api/gallery',
  '/api/reviews',
  '/api/newsletter',
  '/api/contact',
  '/api/birthday-inquiry',
  '/api/community-stories',
  '/api/instagram',
  '/api/auth',
  '/api/checkout',
  '/api/upload',
  '/api/orders',
  '/api/account',
  '/api/admin',
];

/** Cookie name for CSRF token storage */
const CSRF_COOKIE_NAME = 'csrf-token';

/** Header name clients use to send the CSRF token */
const CSRF_HEADER_NAME = 'x-csrf-token';

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { method, nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Only apply CSRF to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip CSRF for exempt paths
  if (isCsrfExempt(pathname)) {
    return NextResponse.next();
  }

  // For GET/HEAD/OPTIONS requests, ensure a CSRF token cookie exists
  if (!STATE_CHANGING_METHODS.includes(method)) {
    const response = NextResponse.next();
    const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    if (!existingToken) {
      const token = generateCsrfToken();
      response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Client JS needs to read this to send in headers
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 2, // 2 hours
      });
    }

    return response;
  }

  // For state-changing methods, validate the CSRF token
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'CSRF token missing',
        retryable: false,
      },
      { status: 403 }
    );
  }

  if (!validateCsrfToken(headerToken, cookieToken)) {
    return NextResponse.json(
      {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'CSRF token invalid',
        retryable: false,
      },
      { status: 403 }
    );
  }

  // CSRF valid — rotate the token for next request
  const response = NextResponse.next();
  const newToken = generateCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 2,
  });

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
