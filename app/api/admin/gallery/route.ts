/**
 * Paint & Keep - Admin Gallery List API
 *
 * GET /api/admin/gallery - List gallery photos for moderation
 * Supports filtering by status, pagination (50/page), and ordering (oldest first).
 *
 * Requirements: 18.1, 18.2, 18.3
 */

import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';

const getGalleryItems: AuthenticatedHandler = async (request) => {
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
      prisma.galleryPhoto.findMany({
        where,
        include: {
          tags: {
            select: { tag: true, source: true },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: orderBy as 'asc' | 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.galleryPhoto.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        displayName: item.displayName,
        kitName: item.kitName,
        likeCount: item.likeCount,
        status: item.status,
        isFeatured: item.isFeatured,
        createdAt: item.createdAt.toISOString(),
        tags: item.tags,
        user: item.user,
      })),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAdminRequired(getGalleryItems, ['super_admin', 'marketing']);
