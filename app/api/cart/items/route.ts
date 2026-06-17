/**
 * Paint & Keep - Cart Items API Route
 *
 * POST /api/cart/items - Add a product to the cart.
 * Validates stock availability and quantity bounds (1-99).
 *
 * Body:
 * - productId: string (required)
 * - quantity: number (optional, default 1, range 1-99)
 *
 * Requirements: 11.2, 11.3
 */

import { NextRequest, NextResponse } from 'next/server';

import { CartService } from '@/lib/services/cart-service';
import { handleApiError, badRequest } from '@/lib/api-error';
import { validateSession } from '@/lib/session';
import { validateQuantity } from '@/lib/validation';
import { SESSION_COOKIE_NAME } from '@/lib/auth-middleware';

/** Cookie name for guest session identifier */
const GUEST_SESSION_COOKIE = 'guest_session_id';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { productId, quantity = 1 } = body;

    if (!productId || typeof productId !== 'string') {
      throw badRequest('productId is required and must be a string');
    }

    // Validate quantity
    const quantityNum = Number(quantity);
    const quantityValidation = validateQuantity(quantityNum);
    if (!quantityValidation.valid) {
      throw badRequest(quantityValidation.error!);
    }

    // Resolve cart identifier, creating guest session if needed
    const { identifier, newGuestSessionId } = await resolveOrCreateCartIdentifier(request);
    const cart = await CartService.addItem(identifier, productId, quantityNum);

    const response = NextResponse.json(cart, { status: 201 });

    // If we created a new guest session, set the cookie
    if (newGuestSessionId) {
      response.cookies.set(GUEST_SESSION_COOKIE, newGuestSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Resolve whether this request is from an authenticated user or a guest.
 * If neither exists, creates a new guest session ID.
 */
async function resolveOrCreateCartIdentifier(
  request: NextRequest
): Promise<{ identifier: { userId?: string; sessionId?: string }; newGuestSessionId?: string }> {
  // Check for authenticated session first
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const session = await validateSession(sessionToken);
    if (session) {
      return { identifier: { userId: session.userId } };
    }
  }

  // Fall back to existing guest session
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE)?.value;

  if (guestSessionId) {
    return { identifier: { sessionId: guestSessionId } };
  }

  // No session exists — create a new guest session ID
  const newGuestSessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return { identifier: { sessionId: newGuestSessionId }, newGuestSessionId };
}
