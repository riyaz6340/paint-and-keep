/**
 * Cloudinary constants shared between client and server.
 * This file does NOT import the cloudinary SDK (which requires Node.js fs).
 */

/** Allowed image MIME types for upload */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Default max file size: 5MB */
export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Max file size for gallery/community uploads: 10MB */
export const MAX_GALLERY_FILE_SIZE = 10 * 1024 * 1024;
