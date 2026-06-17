/**
 * Paint & Keep - Account Orders API
 *
 * GET /api/account/orders - Get paginated order history (20 per page)
 *
 * Requirements: 13.7
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

const ORDERS_PER_PAGE = 20;

/**
 * GET /api/account/orders?page=1&status=SHIPPED
 * Returns paginated orders with items and status.
 */
const getOrders: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const statusFilter = searchParams.get('status')?.toUpperCase();

    // Validate status filter if provided
    const validStatuses = [
      'PENDING',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ];

    const whereClause: Record<string, unknown> = { userId };

    if (statusFilter) {
      if (!validStatuses.includes(statusFilter)) {
        throw badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      whereClause.status = statusFilter;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    take: 1,
                    orderBy: { order: 'asc' },
                    select: { url: true, alt: true },
                  },
                },
              },
            },
          },
          address: {
            select: {
              city: true,
              state: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * ORDERS_PER_PAGE,
        take: ORDERS_PER_PAGE,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / ORDERS_PER_PAGE);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        perPage: ORDERS_PER_PAGE,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuthRequired(getOrders);
