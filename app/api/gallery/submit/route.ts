/**
 * Paint & Keep - Gallery Submit API Route
 *
 * POST /api/gallery/submit - Upload a photo to the customer gallery.
 *
 * Accepts multipart form data:
 * - image: File (JPEG/PNG, max 10MB)
 * - displayName: string (max 100 chars)
 * - kitName: string (max 200 chars)
 *
 * Uploaded photos are queued for moderation (status: PENDING).
 *
 * Requirements: 7.1, 7.3
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import {
  withAuthRequired,
  type AuthenticatedRequest,
} from '@/lib/auth-middleware';
import { uploadImage, ALLOWED_IMAGE_TYPES, MAX_GALLERY_FILE_SIZE } from '@/lib/cloudinary';
import { GalleryService } from '@/lib/services/gallery-service';

export const POST = withAuthRequired(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData();

    // Extract fields
    const imageFile = formData.get('image') as File | null;
    const displayName = formData.get('displayName') as string | null;
    const kitName = formData.get('kitName') as string | null;

    // Validate image file
    if (!imageFile) {
      throw badRequest('Image file is required');
    }

    // Validate file type (JPEG/PNG only for gallery submissions)
    const allowedGalleryTypes = ['image/jpeg', 'image/png'];
    if (!allowedGalleryTypes.includes(imageFile.type)) {
      throw badRequest('Image must be JPEG or PNG format');
    }

    // Validate file size (max 10MB)
    if (imageFile.size > MAX_GALLERY_FILE_SIZE) {
      throw badRequest('Image file size must not exceed 10MB');
    }

    // Validate display name
    if (!displayName || displayName.trim().length === 0) {
      throw badRequest('Display name is required');
    }
    if (displayName.length > 100) {
      throw badRequest('Display name must be 100 characters or less');
    }

    // Validate kit name
    if (!kitName || kitName.trim().length === 0) {
      throw badRequest('Kit name is required');
    }
    if (kitName.length > 200) {
      throw badRequest('Kit name must be 200 characters or less');
    }

    // Upload image to Cloudinary
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResult = await uploadImage(buffer, 'gallery');

    // Create gallery submission (queued for moderation)
    const result = await GalleryService.submitPhoto({
      userId: request.session.userId,
      imageUrl: uploadResult.publicId,
      displayName: displayName.trim(),
      kitName: kitName.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Photo submitted successfully. It will appear in the gallery after moderation.',
        photo: result,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
