/**
 * Paint & Keep - Gallery Save API Route
 *
 * POST /api/gallery/[id]/save - Save a gallery photo to user's collection.
 *
 * - Requires authentication (returns 401 with sign-in prompt if not authenticated)
 * - Idempotent: saving the same photo multiple times has no additional effect
 * - Uses upsert pattern to prevent duplicate saves (@@unique constraint)
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
      throw unauthorized('Please sign in to save photos');
    }

    const session = await validateSession(token);

    if (!session) {
      throw unauthorized('Please sign in to save photos');
    }

    const result = await GalleryService.savePhoto(photoId, session.userId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
