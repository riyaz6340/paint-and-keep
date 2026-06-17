/**
 * Paint & Keep - Order Detail API
 *
 * GET /api/orders/[id]
 *
 * Admin endpoint to retrieve full order details including:
 * - Customer name, email
 * - Items with quantities and prices
 * - Payment status and method
 * - Shipping address
 * - Chronological status history with timestamps and admin identity
 * - Tracking information (carrier, tracking number, estimated delivery)
 *
 * Requires admin authentication with Operations, Customer Support, or Super Admin role.
 *
 * Requirements: 16.5
 */

import { NextResponse } from 'next/server';

import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest } from '@/lib/api-error';
import { OrderService } from '@/lib/services/order-service';

/**
 * GET /api/orders/[id]
 *
 * Path parameters:
 *   - id: The order's unique ID
 *
 * Response:
 *   { success: true, order: OrderDetail }
 *
 * The OrderDetail includes:
 *   - id, orderNumber, status
 *   - customerName, customerEmail
 *   - subtotal, discount, shippingCost, total
 *   - paymentMethod, paymentId
 *   - giftNote
 *   - trackingCarrier, trackingNumber, estimatedDelivery
 *   - createdAt, updatedAt
 *   - items[]: { productId, productName, productSlug, quantity, unitPrice, total }
 *   - address: { fullName, phone, line1, line2, city, state, postalCode, country }
 *   - statusHistory[]: { id, status, adminId, adminName, note, createdAt }
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest, context) => {
    try {
      const { id: orderId } = (context?.params || {}) as { id: string };

      if (!orderId) {
        throw badRequest('Order ID is required');
      }

      const order = await OrderService.getOrder(orderId);

      return NextResponse.json({
        success: true,
        order,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);
