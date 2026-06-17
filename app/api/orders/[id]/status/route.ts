/**
 * Paint & Keep - Order Status Update API
 *
 * PATCH /api/orders/[id]/status
 *
 * Admin endpoint to update an order's status with transition validation.
 * Records the admin identity and optional note in status history.
 * Sends notification to the customer on each status change.
 *
 * Requires admin authentication with Operations, Customer Support, or Super Admin role.
 *
 * Requirements: 16.1, 16.2, 16.7, 16.8
 */

import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';

import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest } from '@/lib/api-error';
import { OrderService } from '@/lib/services/order-service';

// Valid OrderStatus values for request validation
const VALID_STATUSES: string[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

/**
 * PATCH /api/orders/[id]/status
 *
 * Request body:
 *   { status: OrderStatus, note?: string }
 *
 * Response:
 *   Full order detail with updated status and history.
 */
export const PATCH = withAdminRequired(
  async (request: AuthenticatedRequest, context) => {
    try {
      const { id: orderId } = (context?.params || {}) as { id: string };

      if (!orderId) {
        throw badRequest('Order ID is required');
      }

      // Parse and validate request body
      const body = await request.json();
      const { status, note } = body as { status?: string; note?: string };

      if (!status) {
        throw badRequest('Status is required');
      }

      if (!VALID_STATUSES.includes(status)) {
        throw badRequest(
          `Invalid status value: "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
          { validStatuses: VALID_STATUSES }
        );
      }

      // Use the admin's userId from session as the admin identity
      const adminId = request.session.userId;

      // Perform the status transition
      const updatedOrder = await OrderService.transitionOrder(
        orderId,
        status as OrderStatus,
        adminId,
        note
      );

      return NextResponse.json({
        success: true,
        order: updatedOrder,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);
