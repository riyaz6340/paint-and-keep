/**
 * Paint & Keep - Cart Coupon API Route
 *
 * POST /api/cart/coupon - Validate and apply a coupon code to the cart.
 * DELETE /api/cart/coupon - Remove applied coupon from the cart.
 *
 * Body (POST):
 * - code: string (required, max 30 alphanumeric characters)
 *
 * Returns on success:
 * - { success: true, discount, discountType, code }
 *
 * Returns on failure:
 * - { success: false, reason: "unrecognized"|"expired"|"min_amount"|"max_usage"|"inactive" }
 *
 * Requirements: 11.4, 11.5, 11.6, 19.2, 19.3, 19.6
 */

import { NextRequest, NextResponse } from 'next/server';

import { CouponService } from '@/lib/services/coupon-service';
import { CartService } from '@/lib/services/cart-service';
import { handleApiError, badRequest } from '@/lib/api-error';
import { validateSession } from '@/lib/session';
import { SESSION_COOKIE_NAME } from '@/lib/auth-middleware';

/** Cookie name for guest session identifier */
const GUEST_SESSION_COOKIE = 'guest_session_id';

/** Max coupon code length (alphanumeric) */
const MAX_CODE_LENGTH = 30;

/** Regex for valid coupon code: alphanumeric characters only */
const COUPON_CODE_REGEX = /^[A-Za-z0-9]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the coupon code input
    const { code } = body;

    if (!code || typeof code !== 'string') {
      throw badRequest('Coupon code is required');
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length === 0) {
      throw badRequest('Coupon code is required');
    }

    if (trimmedCode.length > MAX_CODE_LENGTH) {
      throw badRequest(`Coupon code must not exceed ${MAX_CODE_LENGTH} characters`);
    }

    if (!COUPON_CODE_REGEX.test(trimmedCode)) {
      throw badRequest('Coupon code must contain only alphanumeric characters');
    }

    // Get the cart to determine the subtotal
    const identifier = await resolveCartIdentifier(request);
    const cart = await CartService.getCart(identifier);

    if (cart.items.length === 0) {
      throw badRequest('Cannot apply coupon to an empty cart');
    }

    // Validate and apply the coupon
    const result = await CouponService.validateAndApply(trimmedCode, cart.subtotal);

    if (result.success) {
      return NextResponse.json({
        success: true,
        discount: result.discount,
        discountType: result.discountType,
        code: result.code,
      });
    }

    // Return rejection with specific reason
    return NextResponse.json(
      {
        success: false,
        reason: result.reason,
      },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code || code.trim().length === 0) {
      throw badRequest('Coupon code is required to remove');
    }

    const removedCode = await CouponService.removeCoupon(code);

    if (!removedCode) {
      return NextResponse.json({
        success: false,
        message: 'Coupon not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon removed',
      code: removedCode,
    });
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

  // No identifier — return empty
  return {};
}
