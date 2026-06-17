/**
 * Paint & Keep - Razorpay Webhook Handler
 *
 * POST /api/webhooks/razorpay
 * Processes payment events from Razorpay:
 * - payment.captured: Payment successful, complete order
 * - payment.failed: Payment failed, handle failure
 *
 * Verifies webhook signature for authenticity.
 * On success: creates Order with status PAID, decrements stock,
 * creates StatusHistory entry, clears cart, sends confirmation email.
 *
 * Requirements: 12.5, 12.6, 12.7, 12.8
 */

import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { CheckoutService } from '@/lib/services/checkout-service';

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = CheckoutService.verifyRazorpayWebhookSignature(
      rawBody,
      signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const paymentId = payment.id;
        const notes = payment.notes || {};
        const orderId = notes.orderId;

        if (!orderId) {
          // Try to find order by payment ID (razorpay order ID)
          const order = await prisma.order.findFirst({
            where: { paymentId: razorpayOrderId },
          });

          if (order) {
            await CheckoutService.handlePaymentSuccess(order.id, paymentId);
          }
        } else {
          await CheckoutService.handlePaymentSuccess(orderId, paymentId);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
      }

      case 'payment.failed': {
        const payment = payload.payload.payment.entity;
        const notes = payment.notes || {};
        const orderId = notes.orderId;
        const errorDescription =
          payment.error_description || 'Payment failed';

        if (orderId) {
          await CheckoutService.handlePaymentFailure(orderId, errorDescription);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
      }

      case 'order.paid': {
        // Additional confirmation event from Razorpay
        const razorpayOrder = payload.payload.order.entity;
        const notes = razorpayOrder.notes || {};
        const orderId = notes.orderId;

        if (orderId) {
          const payments = razorpayOrder.payments || {};
          const paymentId = Object.keys(payments)[0] || razorpayOrder.id;
          await CheckoutService.handlePaymentSuccess(orderId, paymentId);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
      }

      default:
        // Acknowledge unknown events without processing
        return NextResponse.json(
          { status: 'ignored', event },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error('[Razorpay Webhook] Error processing webhook:', error);
    // Return 200 to prevent Razorpay from retrying on processing errors
    // (to avoid duplicate processing)
    return NextResponse.json(
      { status: 'error', message: 'Processing error' },
      { status: 200 }
    );
  }
}
