/**
 * Paint & Keep - Admin Reviews List API
 *
 * GET /api/admin/reviews - List reviews for moderation
 * Supports filtering by status, pagination (50/page), and ordering (oldest first).
 *
 * Requirements: 18.6, 18.7, 27.5
 */

import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';

const getReviewItems: AuthenticatedHandler = async (request) => {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const status = searchParams.get('status')?.toUpperCase();
    const orderBy = searchParams.get('orderBy') === 'oldest' ? 'asc' : 'desc';

    const where: Record<string, unknown> = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'FEATURED'].includes(status)) {
      where.status = status;
    }

    const [items, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true },
          },
          product: {
            select: { name: true, slug: true },
          },
          photos: {
            select: { url: true },
            take: 3,
          },
        },
        orderBy: { createdAt: orderBy as 'asc' | 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        rating: item.rating,
        text: item.text,
        status: item.status,
        isFeatured: item.isFeatured,
        aiSummary: item.aiSummary,
        createdAt: item.createdAt.toISOString(),
        user: item.user,
        product: item.product,
        photos: item.photos,
      })),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAdminRequired(getReviewItems, ['super_admin', 'marketing', 'customer_support']);
