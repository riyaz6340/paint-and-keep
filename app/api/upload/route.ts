import { NextRequest, NextResponse } from 'next/server';
import {
  uploadImage,
  ALLOWED_IMAGE_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  type AllowedImageType,
} from '@/lib/cloudinary';

/**
 * API route for uploading images to Cloudinary.
 * POST /api/upload
 *
 * Accepts multipart form data with:
 * - file: File - The image file to upload
 * - folder: string (optional) - Cloudinary folder (e.g., 'products', 'gallery')
 *
 * Response:
 * - url: string - Cloudinary CDN URL for the uploaded image
 * - publicId: string - Cloudinary public_id for referencing/deleting the image
 * - width: number - Image width in pixels
 * - height: number - Image height in pixels
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: 'No file provided. Send a file via multipart form data.' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
      return NextResponse.json(
        {
          message: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > DEFAULT_MAX_FILE_SIZE) {
      const maxMB = (DEFAULT_MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { message: `File size exceeds ${maxMB}MB limit` },
        { status: 400 }
      );
    }

    // Validate folder name (prevent path traversal)
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_/]/g, '');
    const allowedFolders = [
      'products',
      'gallery',
      'community',
      'reviews',
      'profiles',
      'profile-pictures',
      'uploads',
      'instagram',
      'cms',
    ];

    const baseFolder = sanitizedFolder.split('/')[0];
    if (!allowedFolders.includes(baseFolder)) {
      return NextResponse.json(
        { message: `Invalid upload folder. Allowed: ${allowedFolders.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, sanitizedFolder);

    return NextResponse.json(
      {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
