/**
 * Paint & Keep - Current User API
 *
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's session data.
 * Used by the client-side useAuth hook to check auth state.
 *
 * Requirements: 26.8, 26.9
 */

import { NextResponse } from 'next/server';

import { withAuthRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';

export const GET = withAuthRequired(async (request: AuthenticatedRequest) => {
  const { userId, email, role, metadata } = request.session;

  const user: Record<string, any> = { id: userId, email, role };
  if (metadata && (metadata as any).name) {
    user.name = (metadata as any).name;
  }

  return NextResponse.json({ user });
});
