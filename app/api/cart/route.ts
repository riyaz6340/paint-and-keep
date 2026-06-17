/**
 * Paint & Keep - Cart API Route
 *
 * GET /api/cart - Returns the full cart state including items,
 * subtotal, discount, shipping, and total.
 *
 * Transparently handles both authenticated users (via session cookie)
 * and guest users (via session ID cookie).
 *
 * Requirements: 11.1, 11.2, 11.9
 */

import { NextRequest, NextResponse } from 'next/server';

import { CartService } from '@/lib/services/cart-service';
import { handleApiError } from '@/lib/api-error';
import { validateSession } from '@/lib/session';
import { SESSION_COOKIE_NAME } from '@/lib/auth-middleware';

/** Cookie name for guest session identifier */
const GUEST_SESSION_COOKIE = 'guest_session_id';

export async function GET(request: NextRequest) {
  try {
    const identifier = await resolveCartIdentifier(request);
    const cart = await CartService.getCart(identifier);

    return NextResponse.json(cart);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Resolve whether this request is from an authenticated user or a guest.
 * Authenticated users are identified by their session token (userId from session).
 * Guests are identified by a guest_session_id cookie.
 */
async function resolveCartIdentifier(
  request: NextRequest
): Promise<{ userId?: string; sessionId?: string }> {
  // Check for authenticated session first
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const session = await validateSession(sessionToken);
    if (session) {
      return { userId: session.userId };
    }
  }

  // Fall back to guest session
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE)?.value;

  if (guestSessionId) {
    return { sessionId: guestSessionId };
  }

  // No identifier found — return empty
  return {};
}
