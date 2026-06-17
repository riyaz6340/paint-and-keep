/**
 * Paint & Keep - Reviews API Route
 *
 * POST /api/reviews — Submit a new product review
 * GET /api/reviews?productId=...&page=1&limit=10 — Get paginated reviews for a product
 *
 * Requirements: 27.1, 27.2, 27.3, 27.5, 27.7
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  withAuthRequired,
  type AuthenticatedRequest,
} from '@/lib/auth-middleware';
import { handleApiError, badRequest } from '@/lib/api-error';
import {
  submitReview,
  getProductReviews,
  type ReviewPhotoInput,
} from '@/lib/services/review-service';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 3;

// ─── POST /api/reviews ─────────────────────────────────────────────────────────

/**
 * Submit a new product review.
 *
 * Accepts multipart form data:
 * - productId: string (required)
 * - rating: number 1-5 (required)
 * - text: string 10-2000 chars (required)
 * - photos: File[] (optional, max 3, JPEG/PNG, max 5MB each)
 *
 * Returns 201 on success with pending confirmation.
 * Returns 409 if user already reviewed this product.
 * Returns 400 for validation failures.
 * Returns 401 if not authenticated.
 */
export const POST = withAuthRequired(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData();

    const productId = formData.get('productId') as string | null;
    const ratingStr = formData.get('rating') as string | null;
    const text = formData.get('text') as string | null;

    // Validate required fields
    if (!productId) {
      throw badRequest('productId is required');
    }

    if (!ratingStr) {
      throw badRequest('rating is required');
    }

    if (!text) {
      throw badRequest('text is required');
    }

    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating)) {
      throw badRequest('rating must be a valid integer');
    }

    // Process photos from form data
    const photos: ReviewPhotoInput[] = [];
    const photoFiles = formData.getAll('photos');

    for (const file of photoFiles) {
      if (!(file instanceof File) || file.size === 0) {
        continue; // Skip non-file entries or empty files
      }

      // Validate photo type
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        throw badRequest(
          `Invalid photo format: ${file.type}. Allowed: JPEG, PNG`
        );
      }

      // Validate photo size
      if (file.size > MAX_PHOTO_SIZE) {
        throw badRequest(
          `Photo "${file.name}" exceeds maximum size of 5MB`
        );
      }

      photos.push({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
        size: file.size,
      });
    }

    if (photos.length > MAX_PHOTOS) {
      throw badRequest(`Maximum ${MAX_PHOTOS} photos allowed per review`);
    }

    // Submit the review
    const userId = request.session.userId;
    const result = await submitReview({
      userId,
      productId,
      rating,
      text,
      photos: photos.length > 0 ? photos : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your review has been submitted and is pending moderation. Thank you!',
        review: {
          id: result.id,
          rating: result.rating,
          text: result.text,
          status: result.status,
          photos: result.photos,
          createdAt: result.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── GET /api/reviews ──────────────────────────────────────────────────────────

/**
 * Get paginated approved reviews for a product.
 *
 * Query params:
 * - productId: string (required)
 * - page: number (default 1)
 * - limit: number (default 10)
 *
 * Returns paginated list of approved reviews sorted by most recent.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId');
    if (!productId) {
      throw badRequest('productId query parameter is required');
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const result = await getProductReviews(productId, page, limit);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
