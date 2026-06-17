/**
 * Paint & Keep - Cloudinary Image Management (SERVER-ONLY)
 *
 * Replaces AWS S3 + CloudFront with Cloudinary (free tier: 25GB storage, 25GB bandwidth/month).
 * Handles image upload, deletion, and URL generation with automatic optimization.
 * Cloudinary auto-delivers WebP/AVIF based on browser support.
 *
 * DO NOT import this file in client components. Use @/lib/image-constants for shared constants.
 */

import 'server-only';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  MAX_GALLERY_FILE_SIZE,
  type AllowedImageType,
} from './cloudinary-constants';

// Re-export constants for backward compatibility with server-side imports
export {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  MAX_GALLERY_FILE_SIZE,
  type AllowedImageType,
};

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});



export interface UploadOptions {
  /** Cloudinary folder path (e.g., 'products', 'gallery') */
  folder?: string;
  /** Optional public_id override (auto-generated if omitted) */
  publicId?: string;
  /** Image transformations to apply on upload (eager transforms) */
  transformation?: Record<string, unknown>;
}

export interface UploadResult {
  /** Cloudinary public_id (used to reference the image) */
  publicId: string;
  /** Full secure URL to the uploaded image */
  url: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** File format (jpg, png, webp) */
  format: string;
  /** File size in bytes */
  bytes: number;
}

/**
 * Uploads an image buffer to Cloudinary.
 * Used server-side in API routes to upload files received from multipart form data.
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'uploads',
  options: UploadOptions = {}
): Promise<UploadResult> {
  const uploadOptions: Record<string, unknown> = {
    folder: `paint-and-keep/${folder}`,
    resource_type: 'image',
    // Auto-optimize on upload
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  };

  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
  }

  const result: UploadApiResponse = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      }
    );
    uploadStream.end(fileBuffer);
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Deletes an image from Cloudinary by public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export interface ImageTransformOptions {
  /** Target width in pixels */
  width?: number;
  /** Target height in pixels */
  height?: number;
  /** Image quality (1-100 or 'auto') */
  quality?: number | 'auto';
  /** Output format (auto = browser-optimized WebP/AVIF) */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  /** Crop mode */
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
  /** Gravity for cropping (e.g., 'face', 'center', 'auto') */
  gravity?: string;
}

/**
 * Generates an optimized Cloudinary URL with transformations.
 * Cloudinary automatically delivers the best format (WebP/AVIF) based on browser.
 */
export function getImageUrl(
  publicId: string,
  options: ImageTransformOptions = {}
): string {
  if (!publicId) return '';

  // If it's already a full URL (e.g., from legacy data), return as-is
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
    gravity,
  } = options;

  const transformations: Record<string, unknown> = {
    quality,
    fetch_format: format,
    crop,
  };

  if (width) transformations.width = width;
  if (height) transformations.height = height;
  if (gravity) transformations.gravity = gravity;

  return cloudinary.url(publicId, {
    transformation: [transformations],
    secure: true,
  });
}

/**
 * Returns an optimized URL for common use cases (product cards, thumbnails, etc.).
 * Shorthand for getImageUrl with width and quality.
 */
export function getOptimizedUrl(
  publicId: string,
  width?: number,
  quality: number | 'auto' = 'auto'
): string {
  return getImageUrl(publicId, { width, quality, format: 'auto' });
}



/**
 * Checks if a URL is a Cloudinary URL from our account.
 */
export function isCloudinaryUrl(url: string): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  return url.includes(`res.cloudinary.com/${cloudName}`);
}

/**
 * Extracts the public_id from a Cloudinary URL.
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;
  // Cloudinary URLs follow: https://res.cloudinary.com/{cloud}/image/upload/{transforms}/{public_id}.{ext}
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/);
  return match ? match[1] : null;
}

export { cloudinary };
