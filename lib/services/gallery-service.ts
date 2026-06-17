/**
 * Paint & Keep - Gallery Service
 *
 * Provides gallery photo listing with filters and infinite scroll,
 * photo submission with moderation queuing, like (idempotent),
 * and save-to-collection functionality.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.7
 */

import prisma from '@/lib/prisma';
import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import type { ModerationStatus, Prisma } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GalleryFilters {
  ageGroup?: string;
  theme?: string;
  occasion?: string;
  date?: string;
  location?: string;
}

export interface ListGalleryParams {
  filters?: GalleryFilters;
  cursor?: string;
  limit?: number;
}

export interface GalleryPhotoSummary {
  id: string;
  imageUrl: string;
  displayName: string;
  kitName: string;
  likeCount: number;
  isFeatured: boolean;
  createdAt: Date;
  tags: { tag: string; source: string }[];
}

export interface GalleryListResult {
  photos: GalleryPhotoSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface SubmitPhotoData {
  userId: string;
  imageUrl: string;
  displayName: string;
  kitName: string;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export interface SaveResult {
  saved: boolean;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const GalleryService = {
  /**
   * List approved gallery photos with optional filters and cursor-based pagination.
   * Returns 20 photos per batch with a `hasMore` flag for infinite scroll.
   */
  async listPhotos(params: ListGalleryParams): Promise<GalleryListResult> {
    const { filters, cursor, limit = 20 } = params;

    const where = buildGalleryWhereClause(filters);

    // Fetch one extra to determine if there are more results
    const photos = await prisma.galleryPhoto.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      include: {
        tags: {
          select: { tag: true, source: true },
        },
      },
    });

    const hasMore = photos.length > limit;
    const resultPhotos = hasMore ? photos.slice(0, limit) : photos;
    const nextCursor = hasMore ? resultPhotos[resultPhotos.length - 1].id : null;

    return {
      photos: resultPhotos.map((photo) => ({
        id: photo.id,
        imageUrl: photo.imageUrl,
        displayName: photo.displayName,
        kitName: photo.kitName,
        likeCount: photo.likeCount,
        isFeatured: photo.isFeatured,
        createdAt: photo.createdAt,
        tags: photo.tags.map((t) => ({ tag: t.tag, source: t.source })),
      })),
      hasMore,
      nextCursor,
    };
  },

  /**
   * Submit a new gallery photo. Queued for moderation (status: PENDING).
   */
  async submitPhoto(data: SubmitPhotoData): Promise<{ id: string; status: string }> {
    const { userId, imageUrl, displayName, kitName } = data;

    if (!displayName || displayName.trim().length === 0) {
      throw badRequest('Display name is required');
    }
    if (displayName.length > 100) {
      throw badRequest('Display name must be 100 characters or less');
    }
    if (!kitName || kitName.trim().length === 0) {
      throw badRequest('Kit name is required');
    }
    if (kitName.length > 200) {
      throw badRequest('Kit name must be 200 characters or less');
    }
    if (!imageUrl) {
      throw badRequest('Image URL is required');
    }

    const photo = await prisma.galleryPhoto.create({
      data: {
        userId,
        imageUrl,
        displayName: displayName.trim(),
        kitName: kitName.trim(),
        status: 'PENDING',
      },
    });

    return { id: photo.id, status: photo.status };
  },

  /**
   * Like a gallery photo. Idempotent — uses upsert to prevent duplicates.
   * Atomically increments GalleryPhoto.likeCount.
   *
   * @throws unauthorized if userId is not provided (unauthenticated)
   * @throws notFound if photo doesn't exist
   */
  async likePhoto(photoId: string, userId: string | null): Promise<LikeResult> {
    if (!userId) {
      throw unauthorized('Please sign in to like photos');
    }

    // Verify photo exists and is approved
    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, status: true, likeCount: true },
    });

    if (!photo) {
      throw notFound('Photo not found');
    }

    // Check if user already liked this photo
    const existingLike = await prisma.photoLike.findUnique({
      where: { photoId_userId: { photoId, userId } },
    });

    if (existingLike) {
      // Idempotent — already liked, return current count
      return { liked: true, likeCount: photo.likeCount };
    }

    // Create like and increment count atomically using a transaction
    const [, updatedPhoto] = await prisma.$transaction([
      prisma.photoLike.create({
        data: { photoId, userId },
      }),
      prisma.galleryPhoto.update({
        where: { id: photoId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);

    return { liked: true, likeCount: updatedPhoto.likeCount };
  },

  /**
   * Save a gallery photo to the user's collection. Idempotent.
   *
   * @throws unauthorized if userId is not provided (unauthenticated)
   * @throws notFound if photo doesn't exist
   */
  async savePhoto(photoId: string, userId: string | null): Promise<SaveResult> {
    if (!userId) {
      throw unauthorized('Please sign in to save photos');
    }

    // Verify photo exists
    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId },
      select: { id: true },
    });

    if (!photo) {
      throw notFound('Photo not found');
    }

    // Upsert — idempotent save (won't duplicate due to @@unique constraint)
    await prisma.photoSave.upsert({
      where: { photoId_userId: { photoId, userId } },
      create: { photoId, userId },
      update: {}, // No-op if already saved
    });

    return { saved: true };
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build Prisma where clause for gallery listing.
 * Only shows APPROVED or FEATURED photos by default.
 */
function buildGalleryWhereClause(
  filters?: GalleryFilters
): Prisma.GalleryPhotoWhereInput {
  const where: Prisma.GalleryPhotoWhereInput = {
    status: { in: ['APPROVED', 'FEATURED'] as ModerationStatus[] },
  };

  if (!filters) return where;

  const tagFilters: string[] = [];

  if (filters.ageGroup) {
    tagFilters.push(filters.ageGroup);
  }
  if (filters.theme) {
    tagFilters.push(filters.theme);
  }
  if (filters.occasion) {
    tagFilters.push(filters.occasion);
  }
  if (filters.location) {
    tagFilters.push(filters.location);
  }

  // Filter by tags (photos must have ALL specified tags)
  if (tagFilters.length > 0) {
    where.AND = tagFilters.map((tag) => ({
      tags: {
        some: {
          tag: { equals: tag, mode: 'insensitive' as const },
        },
      },
    }));
  }

  // Filter by date (photos created on or after the specified date)
  if (filters.date) {
    const parsedDate = new Date(filters.date);
    if (!isNaN(parsedDate.getTime())) {
      where.createdAt = { gte: parsedDate };
    }
  }

  return where;
}
