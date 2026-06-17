/**
 * Paint & Keep - Cart Item API Route (Single Item Operations)
 *
 * PATCH /api/cart/items/[id] - Update item quantity (1-99 bounds).
 * DELETE /api/cart/items/[id] - Remove item from cart.
 *
 * The [id] parameter represents the productId for the cart item.
 *
 * Requirements: 11.2, 11.3, 11.10
 */

import { NextRequest, NextResponse } from 'next/server';

import { CartService } from '@/lib/services/cart-service';
import { handleApiError, badRequest } from '@/lib/api-error';
import { validateSession } from '@/lib/session';
import { validateQuantity } from '@/lib/validation';
import { SESSION_COOKIE_NAME } from '@/lib/auth-middleware';

/** Cookie name for guest session identifier */
const GUEST_SESSION_COOKIE = 'guest_session_id';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      throw badRequest('Product ID is required');
    }

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity === null) {
      throw badRequest('quantity is required');
    }

    // Validate quantity bounds (1-99)
    const quantityNum = Number(quantity);
    const quantityValidation = validateQuantity(quantityNum);
    if (!quantityValidation.valid) {
      throw badRequest(quantityValidation.error!);
    }

    const identifier = await resolveCartIdentifier(request);
    const cart = await CartService.updateQuantity(identifier, productId, quantityNum);

    return NextResponse.json(cart);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      throw badRequest('Product ID is required');
    }

    const identifier = await resolveCartIdentifier(request);
    const cart = await CartService.removeItem(identifier, productId);

    return NextResponse.json(cart);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Resolve whether this request is from an authenticated user or a guest.
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

  // No identifier
  throw badRequest('No session found. A session cookie is required to manage cart items.');
}
