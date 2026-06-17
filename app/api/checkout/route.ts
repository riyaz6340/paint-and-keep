/**
 * Paint & Keep - Checkout API Route
 *
 * POST /api/checkout
 * Initiates a checkout session for both guest and authenticated users.
 *
 * - Guest checkout requires email
 * - Authenticated users get pre-filled saved address
 * - Validates shipping address (all required fields, length limits)
 * - Creates pending order and returns payment session details
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { validateSession } from '@/lib/session';
import { CheckoutService, type CheckoutRequest } from '@/lib/services/checkout-service';

const SESSION_COOKIE_NAME = 'session_token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      throw badRequest('Invalid request body');
    }

    const {
      shippingAddress,
      paymentMethod,
      guestEmail,
      couponCode,
      giftNote,
    } = body as CheckoutRequest;

    if (!shippingAddress) {
      throw badRequest('Shipping address is required');
    }

    if (!paymentMethod) {
      throw badRequest('Payment method is required');
    }

    // Check if user is authenticated
    let userId: string | undefined;
    let sessionId: string | undefined;

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      const session = await validateSession(sessionToken);
      if (session) {
        userId = session.userId;
      }
    }

    // For guest users, get the session ID for cart lookup
    if (!userId) {
      const guestSessionCookie = request.cookies.get('guest_session')?.value;
      sessionId = guestSessionCookie || undefined;

      if (!guestEmail) {
        throw badRequest('Email is required for guest checkout');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        throw badRequest('Invalid email format');
      }
    }

    // Initiate checkout
    const result = await CheckoutService.initiateCheckout(
      {
        shippingAddress,
        paymentMethod,
        guestEmail,
        couponCode,
        giftNote,
      },
      userId,
      sessionId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/checkout
 * Returns saved address for authenticated users (pre-fill support).
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ savedAddress: null });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ savedAddress: null });
    }

    const savedAddress = await CheckoutService.getSavedAddress(session.userId);

    return NextResponse.json({ savedAddress });
  } catch (error) {
    return handleApiError(error);
  }
}
