/**
 * Paint & Keep - Admin Instagram Manual Upload API
 *
 * POST /api/admin/instagram/upload - Upload an Instagram post manually
 * Used when automatic Instagram sync is unavailable.
 *
 * Accepts multipart form data: image, username, caption, postDate, postUrl (optional)
 *
 * Requirements: 9.5
 */

import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { handleApiError, badRequest } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const uploadHandler: AuthenticatedHandler = async (request) => {
  try {
    const formData = await request.formData();

    const image = formData.get('image') as File | null;
    const username = formData.get('username') as string | null;
    const caption = formData.get('caption') as string | null;
    const postDate = formData.get('postDate') as string | null;
    const postUrl = formData.get('postUrl') as string | null;

    // Validation
    if (!image || !(image instanceof File)) {
      throw badRequest('Image is required');
    }

    if (image.size > MAX_IMAGE_SIZE) {
      throw badRequest('Image must be less than 10MB');
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      throw badRequest('Only JPEG, PNG, and WebP images are allowed');
    }

    if (!username || username.trim().length === 0) {
      throw badRequest('Username is required');
    }

    if (!caption || caption.trim().length === 0) {
      throw badRequest('Caption is required');
    }

    if (!postDate) {
      throw badRequest('Post date is required');
    }

    const parsedDate = new Date(postDate);
    if (isNaN(parsedDate.getTime())) {
      throw badRequest('Invalid post date');
    }

    // In production, upload image to S3/Cloudinary and get URL
    // For now, convert to a data URL or use a placeholder path
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const base64 = imageBuffer.toString('base64');
    const imageUrl = `data:${image.type};base64,${base64}`;

    // Create Instagram post with PENDING status
    const post = await prisma.instagramPost.create({
      data: {
        imageUrl,
        caption: caption.trim().slice(0, 2200),
        username: username.trim().slice(0, 100),
        postDate: parsedDate,
        postUrl: postUrl?.trim() || null,
        status: 'PENDING',
        isFeatured: false,
        likeCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Instagram post uploaded successfully',
      data: {
        id: post.id,
        username: post.username,
        status: post.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withAdminRequired(uploadHandler, ['super_admin', 'marketing']);
