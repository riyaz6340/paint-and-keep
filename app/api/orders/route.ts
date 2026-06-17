/**
 * Paint & Keep - Admin Order Listing API
 *
 * GET /api/orders
 *
 * Admin endpoint to list all orders with filtering and pagination.
 * Supports filtering by status, date range, customer (name/email search),
 * and payment method. Results are paginated at a maximum of 50 orders per page.
 *
 * Requires admin authentication with Operations, Customer Support, or Super Admin role.
 *
 * Requirements: 16.5, 16.6
 */

import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';

import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest } from '@/lib/api-error';
import { OrderService, type OrderFilters } from '@/lib/services/order-service';

// Valid OrderStatus values for filter validation
const VALID_STATUSES: string[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

// Valid payment method values
const VALID_PAYMENT_METHODS: string[] = ['RAZORPAY', 'STRIPE'];

/**
 * GET /api/orders
 *
 * Query parameters:
 *   - status: OrderStatus (optional) — filter by order status
 *   - dateFrom: ISO date string (optional) — filter orders created on or after this date
 *   - dateTo: ISO date string (optional) — filter orders created on or before this date
 *   - customer: string (optional) — search by customer name or email (partial match)
 *   - paymentMethod: 'RAZORPAY' | 'STRIPE' (optional) — filter by payment method
 *   - page: number (optional, default 1) — page number for pagination
 *   - limit: number (optional, default 20, max 50) — results per page
 *
 * Response:
 *   { success: true, orders: OrderSummary[], total, page, totalPages }
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse and validate query parameters
      const filters: OrderFilters = {};

      // Status filter
      const status = searchParams.get('status');
      if (status) {
        if (!VALID_STATUSES.includes(status.toUpperCase())) {
          throw badRequest(
            `Invalid status filter: "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
            { validStatuses: VALID_STATUSES }
          );
        }
        filters.status = status.toUpperCase() as OrderStatus;
      }

      // Date range filters
      const dateFrom = searchParams.get('dateFrom');
      if (dateFrom) {
        const parsed = new Date(dateFrom);
        if (isNaN(parsed.getTime())) {
          throw badRequest('Invalid dateFrom value. Must be a valid ISO date string.');
        }
        filters.dateFrom = parsed;
      }

      const dateTo = searchParams.get('dateTo');
      if (dateTo) {
        const parsed = new Date(dateTo);
        if (isNaN(parsed.getTime())) {
          throw badRequest('Invalid dateTo value. Must be a valid ISO date string.');
        }
        filters.dateTo = parsed;
      }

      // Customer search (name or email partial match)
      const customer = searchParams.get('customer');
      if (customer) {
        if (customer.trim().length === 0) {
          throw badRequest('Customer search term cannot be empty.');
        }
        filters.customer = customer.trim();
      }

      // Payment method filter
      const paymentMethod = searchParams.get('paymentMethod');
      if (paymentMethod) {
        if (!VALID_PAYMENT_METHODS.includes(paymentMethod.toUpperCase())) {
          throw badRequest(
            `Invalid paymentMethod filter: "${paymentMethod}". Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
            { validPaymentMethods: VALID_PAYMENT_METHODS }
          );
        }
        filters.paymentMethod = paymentMethod.toUpperCase() as 'RAZORPAY' | 'STRIPE';
      }

      // Pagination
      const pageParam = searchParams.get('page');
      if (pageParam) {
        const page = parseInt(pageParam, 10);
        if (isNaN(page) || page < 1) {
          throw badRequest('Page must be a positive integer.');
        }
        filters.page = page;
      }

      const limitParam = searchParams.get('limit');
      if (limitParam) {
        const limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit < 1) {
          throw badRequest('Limit must be a positive integer.');
        }
        // Cap at 50 as per requirement 16.6
        filters.limit = Math.min(limit, 50);
      }

      // Fetch orders via service
      const result = await OrderService.listOrders(filters);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);
