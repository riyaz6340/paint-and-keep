/**
 * Paint & Keep - Gallery Like API Route
 *
 * POST /api/gallery/[id]/like - Like a gallery photo.
 *
 * - Requires authentication (returns 401 with sign-in prompt if not authenticated)
 * - Idempotent: liking the same photo multiple times has no additional effect
 * - Atomically increments GalleryPhoto.likeCount using a transaction
 * - Uses upsert pattern to prevent duplicate likes (@@unique constraint)
 *
 * Requirements: 7.3, 7.7
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, unauthorized } from '@/lib/api-error';
import { validateSession } from '@/lib/session';
import { GalleryService } from '@/lib/services/gallery-service';

const SESSION_COOKIE_NAME = 'session_token';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params;

    // Check authentication — return sign-in prompt if not authenticated
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      throw unauthorized('Please sign in to like photos');
    }

    const session = await validateSession(token);

    if (!session) {
      throw unauthorized('Please sign in to like photos');
    }

    const result = await GalleryService.likePhoto(photoId, session.userId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
