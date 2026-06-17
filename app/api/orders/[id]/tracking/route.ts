/**
 * Paint & Keep - Order Tracking API
 *
 * GET /api/orders/[id]/tracking
 *
 * Retrieves shipping tracking information for an order.
 * Returns the stored tracking data (carrier, tracking number, current status)
 * from the Order record.
 *
 * Since no real shipping provider API is integrated, this endpoint returns
 * the locally stored tracking data. If the tracking data has not been updated
 * recently (more than 24 hours), a stale warning is included in the response
 * to indicate the data may not be current.
 *
 * Requires admin authentication with Operations, Customer Support, or Super Admin role.
 *
 * Requirements: 16.3, 16.4
 */

import { NextResponse } from 'next/server';

import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import prisma from '@/lib/prisma';

/** Threshold in milliseconds after which tracking data is considered stale (24 hours) */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/orders/[id]/tracking
 *
 * Path parameters:
 *   - id: The order's unique ID
 *
 * Response:
 *   {
 *     success: true,
 *     tracking: {
 *       carrier: string | null,
 *       trackingNumber: string | null,
 *       estimatedDelivery: string | null,
 *       orderStatus: string,
 *       lastUpdated: string,
 *       isStale: boolean,
 *       staleWarning: string | null
 *     }
 *   }
 *
 * When tracking data is unavailable (order not shipped yet), returns
 * a response indicating no tracking info is available.
 *
 * When tracking data may not be current (stale), includes a warning message
 * per requirement 16.4.
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest, context) => {
    try {
      const { id: orderId } = (context?.params || {}) as { id: string };

      if (!orderId) {
        throw badRequest('Order ID is required');
      }

      // Fetch order with tracking-relevant fields
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          trackingCarrier: true,
          trackingNumber: true,
          estimatedDelivery: true,
          updatedAt: true,
        },
      });

      if (!order) {
        throw notFound(`Order not found: ${orderId}`);
      }

      // Determine if tracking data is available
      const hasTracking = !!(order.trackingCarrier || order.trackingNumber);

      // Determine if tracking data is stale (not updated within threshold)
      const now = new Date();
      const lastUpdated = order.updatedAt;
      const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
      const isStale = hasTracking && timeSinceUpdate > STALE_THRESHOLD_MS;

      // Build stale warning message per requirement 16.4
      let staleWarning: string | null = null;
      if (isStale) {
        staleWarning =
          'Tracking information may not be current. The shipping provider data has not been updated in the last 24 hours.';
      }

      // If order is not in a shipped/delivered state and has no tracking, inform accordingly
      const isShippedOrDelivered = ['SHIPPED', 'DELIVERED'].includes(order.status);
      if (!hasTracking && !isShippedOrDelivered) {
        return NextResponse.json({
          success: true,
          tracking: {
            carrier: null,
            trackingNumber: null,
            estimatedDelivery: null,
            orderStatus: order.status,
            lastUpdated: lastUpdated.toISOString(),
            isStale: false,
            staleWarning: null,
            message: 'Tracking information is not yet available for this order.',
          },
        });
      }

      return NextResponse.json({
        success: true,
        tracking: {
          carrier: order.trackingCarrier,
          trackingNumber: order.trackingNumber,
          estimatedDelivery: order.estimatedDelivery
            ? order.estimatedDelivery.toISOString()
            : null,
          orderStatus: order.status,
          lastUpdated: lastUpdated.toISOString(),
          isStale,
          staleWarning,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);
