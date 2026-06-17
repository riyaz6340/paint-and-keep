/**
 * Paint & Keep - Unified Moderation API
 *
 * POST /api/admin/moderation
 * Handles approve, reject, and feature actions for gallery photos,
 * Instagram posts, reviews, and community stories.
 *
 * Body: { type: 'gallery'|'instagram'|'review'|'story', id, action: 'approve'|'reject'|'feature', reason?, tags? }
 *
 * Approved content appears on storefront within 60 seconds via ISR revalidation.
 * Featured content is marked with isFeatured flag for prominent display.
 *
 * Requirements: 18.1-18.7, 8.5, 8.6, 9.4, 9.5
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import prisma from '@/lib/prisma';
import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';

/* ─── Types ────────────────────────────────────────────────────────────── */

type ContentType = 'gallery' | 'instagram' | 'review' | 'story';
type ModerationAction = 'approve' | 'reject' | 'feature';

interface ModerationRequest {
  type: ContentType;
  id: string;
  action: ModerationAction;
  reason?: string;
  tags?: string[];
}

const VALID_TYPES: ContentType[] = ['gallery', 'instagram', 'review', 'story'];
const VALID_ACTIONS: ModerationAction[] = ['approve', 'reject', 'feature'];

/* ─── Validation ───────────────────────────────────────────────────────── */

function validateRequest(body: unknown): ModerationRequest {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const { type, id, action, reason, tags } = body as Record<string, unknown>;

  if (!type || !VALID_TYPES.includes(type as ContentType)) {
    throw badRequest(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw badRequest('Item id is required');
  }

  if (!action || !VALID_ACTIONS.includes(action as ModerationAction)) {
    throw badRequest(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  if (action === 'reject' && type === 'story' && (!reason || typeof reason !== 'string' || reason.trim().length === 0)) {
    throw badRequest('Rejection reason is required for community stories');
  }

  if (tags && (!Array.isArray(tags) || tags.some((t: unknown) => typeof t !== 'string'))) {
    throw badRequest('Tags must be an array of strings');
  }

  if (Array.isArray(tags) && tags.length > 5) {
    throw badRequest('Maximum 5 tags allowed per item');
  }

  return {
    type: type as ContentType,
    id: (id as string).trim(),
    action: action as ModerationAction,
    reason: reason ? String(reason).trim() : undefined,
    tags: tags as string[] | undefined,
  };
}

/* ─── Moderation Handlers ──────────────────────────────────────────────── */

async function moderateGallery(id: string, action: ModerationAction, reason?: string, tags?: string[]) {
  const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
  if (!photo) throw notFound('Gallery photo not found');

  const status = action === 'approve' ? 'APPROVED' : action === 'feature' ? 'FEATURED' : 'REJECTED';
  const isFeatured = action === 'feature';

  await prisma.galleryPhoto.update({
    where: { id },
    data: { status, isFeatured },
  });

  // Handle tags/categorization for gallery photos
  if (tags && tags.length > 0 && action !== 'reject') {
    // Remove existing manual tags and add new ones
    await prisma.photoTag.deleteMany({
      where: { photoId: id, source: 'MANUAL' },
    });

    await prisma.photoTag.createMany({
      data: tags.map((tag) => ({
        photoId: id,
        tag,
        source: 'MANUAL' as const,
      })),
    });
  }

  return { id, type: 'gallery', status, isFeatured };
}

async function moderateInstagram(id: string, action: ModerationAction) {
  const post = await prisma.instagramPost.findUnique({ where: { id } });
  if (!post) throw notFound('Instagram post not found');

  const status = action === 'approve' ? 'APPROVED' : action === 'feature' ? 'FEATURED' : 'REJECTED';
  const isFeatured = action === 'feature';

  await prisma.instagramPost.update({
    where: { id },
    data: { status, isFeatured },
  });

  return { id, type: 'instagram', status, isFeatured };
}

async function moderateReview(id: string, action: ModerationAction) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: { select: { id: true } } },
  });
  if (!review) throw notFound('Review not found');

  const status = action === 'approve' ? 'APPROVED' : action === 'feature' ? 'FEATURED' : 'REJECTED';
  const isFeatured = action === 'feature';

  await prisma.review.update({
    where: { id },
    data: { status, isFeatured },
  });

  // Recalculate product average rating when approving/featuring
  if (action === 'approve' || action === 'feature') {
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId: review.productId,
        status: { in: ['APPROVED', 'FEATURED'] },
      },
      select: { rating: true },
    });

    if (approvedReviews.length > 0) {
      const avg =
        approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          averageRating: Math.round(avg * 10) / 10,
          reviewCount: approvedReviews.length,
        },
      });
    }
  }

  return { id, type: 'review', status, isFeatured };
}

async function moderateStory(id: string, action: ModerationAction, reason?: string) {
  const story = await prisma.communityStory.findUnique({ where: { id } });
  if (!story) throw notFound('Community story not found');

  const status = action === 'approve' ? 'APPROVED' : action === 'feature' ? 'FEATURED' : 'REJECTED';

  await prisma.communityStory.update({
    where: { id },
    data: {
      status,
      rejectReason: action === 'reject' ? reason : null,
    },
  });

  return { id, type: 'story', status };
}

/* ─── Route Handler ────────────────────────────────────────────────────── */

const postHandler: AuthenticatedHandler = async (request) => {
  try {
    const body = await request.json();
    const { type, id, action, reason, tags } = validateRequest(body);

    let result;

    switch (type) {
      case 'gallery':
        result = await moderateGallery(id, action, reason, tags);
        revalidatePath('/gallery');
        break;
      case 'instagram':
        result = await moderateInstagram(id, action);
        revalidatePath('/instagram');
        break;
      case 'review':
        result = await moderateReview(id, action);
        revalidatePath('/shop');
        break;
      case 'story':
        result = await moderateStory(id, action, reason);
        revalidatePath('/community-stories');
        break;
    }

    // Also revalidate homepage since it shows gallery/instagram previews
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: `Item ${action}d successfully`,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// Only Super Admin and Marketing roles can moderate content
export const POST = withAdminRequired(postHandler, ['super_admin', 'marketing', 'customer_support']);
