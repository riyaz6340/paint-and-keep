/**
 * Paint & Keep - Admin Instagram List API
 *
 * GET /api/admin/instagram - List Instagram posts for moderation
 * Supports filtering by status, pagination (50/page), and ordering (oldest first).
 *
 * Requirements: 9.4, 9.5
 */

import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';

const getInstagramItems: AuthenticatedHandler = async (request) => {
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
      prisma.instagramPost.findMany({
        where,
        orderBy: { createdAt: orderBy as 'asc' | 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.instagramPost.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        caption: item.caption,
        username: item.username,
        likeCount: item.likeCount,
        postDate: item.postDate.toISOString(),
        postUrl: item.postUrl,
        status: item.status,
        isFeatured: item.isFeatured,
        createdAt: item.createdAt.toISOString(),
      })),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAdminRequired(getInstagramItems, ['super_admin', 'marketing']);
