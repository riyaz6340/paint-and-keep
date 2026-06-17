/**
 * Paint & Keep - Community Stories API Route
 *
 * GET  /api/community-stories - List approved community stories
 * POST /api/community-stories - Submit a new story (with file uploads, moderation queuing)
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { handleApiError, badRequest } from '@/lib/api-error';
import { uploadImage, ALLOWED_IMAGE_TYPES } from '@/lib/cloudinary';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ARTWORK_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/community-stories
 * Returns approved community stories for public display.
 */
export async function GET() {
  try {
    const stories = await prisma.communityStory.findMany({
      where: {
        status: { in: ['APPROVED', 'FEATURED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        age: true,
        reviewText: true,
        photoUrl: true,
        artworkUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ stories });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/community-stories
 * Submit a new community story with photo and artwork image uploads.
 * Story is queued for admin moderation (status: PENDING).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name') as string | null;
    const ageStr = formData.get('age') as string | null;
    const reviewText = formData.get('reviewText') as string | null;
    const photo = formData.get('photo') as File | null;
    const artwork = formData.get('artwork') as File | null;

    // Validate all fields — collect errors
    const errors: Record<string, string> = {};

    // Name validation
    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.trim().length > 50) {
      errors.name = 'Name must not exceed 50 characters';
    }

    // Age validation
    if (!ageStr || ageStr.trim().length === 0) {
      errors.age = 'Age is required';
    } else {
      const age = parseInt(ageStr, 10);
      if (isNaN(age) || age < 1 || age > 120) {
        errors.age = 'Age must be between 1 and 120';
      }
    }

    // Review text validation
    if (!reviewText || reviewText.trim().length === 0) {
      errors.reviewText = 'Review text is required';
    } else if (reviewText.trim().length < 10) {
      errors.reviewText = 'Review text must be at least 10 characters';
    } else if (reviewText.trim().length > 1000) {
      errors.reviewText = 'Review text must not exceed 1000 characters';
    }

    // Photo validation
    if (!photo || !(photo instanceof File) || photo.size === 0) {
      errors.photo = 'Photo is required';
    } else {
      if (!ALLOWED_IMAGE_TYPES.includes(photo.type as typeof ALLOWED_IMAGE_TYPES[number])) {
        errors.photo = 'Photo must be JPEG or PNG';
      } else if (photo.size > MAX_PHOTO_SIZE) {
        errors.photo = 'Photo must not exceed 5MB';
      }
    }

    // Artwork validation
    if (!artwork || !(artwork instanceof File) || artwork.size === 0) {
      errors.artwork = 'Artwork image is required';
    } else {
      if (!ALLOWED_IMAGE_TYPES.includes(artwork.type as typeof ALLOWED_IMAGE_TYPES[number])) {
        errors.artwork = 'Artwork must be JPEG or PNG';
      } else if (artwork.size > MAX_ARTWORK_SIZE) {
        errors.artwork = 'Artwork must not exceed 10MB';
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      throw badRequest('Validation failed', { errors });
    }

    // Upload images to Cloudinary
    const photoBuffer = Buffer.from(await photo!.arrayBuffer());
    const artworkBuffer = Buffer.from(await artwork!.arrayBuffer());

    const [photoResult, artworkResult] = await Promise.all([
      uploadImage(photoBuffer, 'community-stories/photos'),
      uploadImage(artworkBuffer, 'community-stories/artwork'),
    ]);

    // Create story record with PENDING status for moderation
    const story = await prisma.communityStory.create({
      data: {
        name: name!.trim(),
        age: parseInt(ageStr!, 10),
        reviewText: reviewText!.trim(),
        photoUrl: photoResult.url,
        artworkUrl: artworkResult.url,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your story has been submitted and is pending review. Thank you for sharing!',
        storyId: story.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
