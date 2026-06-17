/**
 * Paint & Keep - Review Service
 *
 * Handles review submission, moderation, pagination, and product rating recalculation.
 * Enforces one review per product per user, validates input, and queues for moderation.
 *
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7
 */

import prisma from '@/lib/prisma';
import { badRequest, conflict, notFound } from '@/lib/api-error';
import { uploadImage } from '@/lib/cloudinary';
import type { ModerationStatus } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SubmitReviewInput {
  userId: string;
  productId: string;
  rating: number;
  text: string;
  photos?: ReviewPhotoInput[];
}

export interface ReviewPhotoInput {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export interface ReviewResult {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  text: string;
  status: ModerationStatus;
  photos: { id: string; url: string }[];
  createdAt: Date;
}

export interface PaginatedReviews {
  reviews: ReviewDisplay[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ReviewDisplay {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  isFeatured: boolean;
  user: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  photos: { id: string; url: string }[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MIN_RATING = 1;
const MAX_RATING = 5;
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 2000;
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES: string[] = ['image/jpeg', 'image/png'];
const DEFAULT_PAGE_SIZE = 10;

// ─── Service Functions ─────────────────────────────────────────────────────────

/**
 * Submit a new review for a product.
 * Validates all inputs, checks for duplicate reviews, and queues for moderation.
 */
export async function submitReview(input: SubmitReviewInput): Promise<ReviewResult> {
  const { userId, productId, rating, text, photos } = input;

  // Validate rating is an integer between 1-5
  if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    throw badRequest(`Rating must be an integer between ${MIN_RATING} and ${MAX_RATING}`);
  }

  // Validate text length
  if (!text || text.trim().length < MIN_TEXT_LENGTH) {
    throw badRequest(`Review text must be at least ${MIN_TEXT_LENGTH} characters`);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw badRequest(`Review text must not exceed ${MAX_TEXT_LENGTH} characters`);
  }

  // Validate photos if provided
  if (photos && photos.length > MAX_PHOTOS) {
    throw badRequest(`Maximum ${MAX_PHOTOS} photos allowed per review`);
  }

  if (photos) {
    for (const photo of photos) {
      if (!ALLOWED_PHOTO_TYPES.includes(photo.mimeType)) {
        throw badRequest(
          `Invalid photo format: ${photo.mimeType}. Allowed: JPEG, PNG`
        );
      }
      if (photo.size > MAX_PHOTO_SIZE) {
        throw badRequest(
          `Photo exceeds maximum size of ${MAX_PHOTO_SIZE / (1024 * 1024)}MB`
        );
      }
    }
  }

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw notFound('Product not found');
  }

  // Check if user has already reviewed this product
  const existingReview = await hasUserReviewed(userId, productId);
  if (existingReview) {
    throw conflict('You have already submitted a review for this product');
  }

  // Check if user has purchased this product (order status: DELIVERED, SHIPPED, or PROCESSING)
  const hasPurchased = await hasUserPurchasedProduct(userId, productId);
  if (!hasPurchased) {
    throw badRequest('You can only review products you have purchased');
  }

  // Upload photos to Cloudinary if provided
  const uploadedPhotos: { url: string }[] = [];
  if (photos && photos.length > 0) {
    for (const photo of photos) {
      const result = await uploadImage(photo.buffer, 'reviews');
      uploadedPhotos.push({ url: result.url });
    }
  }

  // Create review with PENDING status
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      text: text.trim(),
      status: 'PENDING',
      photos: {
        create: uploadedPhotos.map((p) => ({ url: p.url })),
      },
    },
    include: {
      photos: { select: { id: true, url: true } },
    },
  });

  return {
    id: review.id,
    userId: review.userId,
    productId: review.productId,
    rating: review.rating,
    text: review.text,
    status: review.status,
    photos: review.photos,
    createdAt: review.createdAt,
  };
}

/**
 * Approve a review and recalculate the product's average rating.
 */
export async function approveReview(reviewId: string, adminId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true, status: true },
  });

  if (!review) {
    throw notFound('Review not found');
  }

  if (review.status === 'APPROVED') {
    return; // Already approved, no-op
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'APPROVED' },
  });

  // Recalculate product average rating
  await recalculateProductRating(review.productId);
}

/**
 * Reject a review.
 */
export async function rejectReview(reviewId: string, adminId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true, status: true },
  });

  if (!review) {
    throw notFound('Review not found');
  }

  const wasApproved = review.status === 'APPROVED';

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'REJECTED' },
  });

  // If it was previously approved, recalculate the rating
  if (wasApproved) {
    await recalculateProductRating(review.productId);
  }
}

/**
 * Get paginated approved reviews for a product, sorted by most recent.
 */
export async function getProductReviews(
  productId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedReviews> {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        photos: {
          select: { id: true, url: true },
        },
      },
    }),
    prisma.review.count({
      where: {
        productId,
        status: 'APPROVED',
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      isFeatured: r.isFeatured,
      user: {
        id: r.user.id,
        name: r.user.name,
        profileImage: r.user.profileImage,
      },
      photos: r.photos,
    })),
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Check if a user has already reviewed a specific product.
 */
export async function hasUserReviewed(userId: string, productId: string): Promise<boolean> {
  const review = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    select: { id: true },
  });

  return review !== null;
}

/**
 * Recalculate and update a product's average rating and review count
 * based on all APPROVED reviews.
 */
export async function recalculateProductRating(productId: string): Promise<void> {
  const result = await prisma.review.aggregate({
    where: {
      productId,
      status: 'APPROVED',
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = result._avg.rating ?? 0;
  const reviewCount = result._count.rating;

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount,
    },
  });
}

/**
 * Check if a user has purchased (and received) a specific product.
 * A user is considered to have purchased a product if they have a
 * DELIVERED, SHIPPED, or PROCESSING order containing that product.
 */
async function hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'PAID'] },
      items: {
        some: { productId },
      },
    },
    select: { id: true },
  });

  return order !== null;
}
