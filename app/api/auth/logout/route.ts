/**
 * Paint & Keep - Logout API
 *
 * POST /api/auth/logout
 *
 * Destroys the current session and clears the session cookie.
 * Returns 200 on success regardless of whether a session existed.
 *
 * Requirements: 26.8, 26.9
 */

import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/lib/auth-middleware';
import { destroySession } from '@/lib/session';
import { handleApiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Destroy session in Redis if token exists
    if (token) {
      await destroySession(token);
    }

    // Build response with cleared cookie
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear the session cookie
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
