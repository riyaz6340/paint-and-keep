/**
 * Paint & Keep - Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 * Processes payment events from Stripe:
 * - checkout.session.completed: Payment successful, complete order
 * - checkout.session.expired: Session expired, handle failure
 * - payment_intent.payment_failed: Payment failed, handle failure
 *
 * Verifies webhook signature for authenticity using Stripe's library.
 * On success: creates Order with status PAID, decrements stock,
 * creates StatusHistory entry, clears cart, sends confirmation email.
 *
 * Requirements: 12.5, 12.6, 12.7, 12.8
 */

import { NextRequest, NextResponse } from 'next/server';

import { CheckoutService } from '@/lib/services/checkout-service';

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature and construct event
    const event = CheckoutService.verifyStripeWebhookSignature(
      rawBody,
      signature
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id: string;
          payment_intent: string | null;
          metadata: { orderId?: string; orderNumber?: string } | null;
          payment_status: string;
        };

        const orderId = session.metadata?.orderId;
        const paymentId =
          (typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.id) || session.id;

        if (!orderId) {
          console.error('[Stripe Webhook] No orderId in session metadata');
          return NextResponse.json(
            { status: 'error', message: 'Missing order ID in metadata' },
            { status: 200 }
          );
        }

        // Only process if payment was successful
        if (session.payment_status === 'paid') {
          await CheckoutService.handlePaymentSuccess(orderId, paymentId);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
      }

      case 'checkout.session.expired': {
        const session = event.data.object as {
          metadata: { orderId?: string } | null;
        };

        const orderId = session.metadata?.orderId;

        if (orderId) {
          await CheckoutService.handlePaymentFailure(
            orderId,
            'Payment session expired. Please try again.'
          );
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as {
          metadata: { orderId?: string } | null;
          last_payment_error?: { message?: string } | null;
        };

        const orderId = paymentIntent.metadata?.orderId;
        const errorMessage =
          paymentIntent.last_payment_error?.message || 'Payment failed';

        if (orderId) {
          await CheckoutService.handlePaymentFailure(orderId, errorMessage);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
      }

      default:
        // Acknowledge unknown events without processing
        return NextResponse.json(
          { status: 'ignored', event: event.type },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    // Return 200 to prevent Stripe from retrying on processing errors
    return NextResponse.json(
      { status: 'error', message: 'Processing error' },
      { status: 200 }
    );
  }
}
