/**
 * Paint & Keep - Account Order Detail API
 *
 * GET /api/account/orders/[id] - Get single order detail for authenticated user
 *
 * Returns full order details including items, address, status history,
 * and tracking information for the authenticated user.
 *
 * Requirements: 13.7, 13.8
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/account/orders/[id]
 * Returns detailed order information including items, address, status history, and tracking.
 */
const getOrderDetail: AuthenticatedHandler = async (request, context) => {
  try {
    const { userId } = request.session;
    const orderId = context?.params?.id;

    if (!orderId) {
      throw badRequest('Order ID is required');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
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
        address: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            status: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw notFound('Order not found');
    }

    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuthRequired(getOrderDetail);
