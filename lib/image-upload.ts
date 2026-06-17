import { ALLOWED_IMAGE_TYPES, DEFAULT_MAX_FILE_SIZE, type AllowedImageType } from './cloudinary-constants';

/**
 * Image upload utility for client-side use.
 * Handles validation, upload to Cloudinary via API route, and URL generation.
 */

export interface ImageValidationOptions {
  /** Allowed MIME types (default: JPEG, PNG, WebP) */
  allowedTypes?: readonly string[];
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  percent: number;
  /** Bytes uploaded so far */
  loaded: number;
  /** Total file size in bytes */
  total: number;
}

export interface UploadResult {
  /** Cloudinary public_id (replaces S3 key) */
  key: string;
  /** Public URL for the uploaded image (Cloudinary CDN) */
  cdnUrl: string;
  /** Cloudinary public_id */
  publicId: string;
  /** Original file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  contentType: string;
}

/**
 * Validates an image file before upload.
 */
export function validateImage(
  file: File,
  options: ImageValidationOptions = {}
): ImageValidationResult {
  const {
    allowedTypes = ALLOWED_IMAGE_TYPES,
    maxSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.type as AllowedImageType)) {
    const allowed = allowedTypes
      .map((t) => t.replace('image/', '').toUpperCase())
      .join(', ');
    return {
      valid: false,
      error: `Invalid file type. Allowed formats: ${allowed}`,
    };
  }

  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${maxMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validates multiple image files.
 */
export function validateImages(
  files: File[],
  options: ImageValidationOptions = {}
): { valid: File[]; invalid: { file: File; error: string }[] } {
  const valid: File[] = [];
  const invalid: { file: File; error: string }[] = [];

  for (const file of files) {
    const result = validateImage(file, options);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error || 'Unknown error' });
    }
  }

  return { valid, invalid };
}

/**
 * Uploads a file to Cloudinary via the /api/upload route with progress tracking.
 */
export async function uploadFileToCloudinary(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          percent: Math.round((event.loaded / event.total) * 100),
          loaded: event.loaded,
          total: event.total,
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ url: response.url, publicId: response.publicId });
        } catch {
          reject(new Error('Invalid response from upload server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

/**
 * Complete image upload flow: validate → upload to Cloudinary → return result.
 */
export async function uploadImage(
  file: File,
  options: {
    folder?: string;
    validationOptions?: ImageValidationOptions;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<UploadResult> {
  const { folder = 'uploads', validationOptions, onProgress } = options;

  // Validate file
  const validation = validateImage(file, validationOptions);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Upload to Cloudinary via API route
  const { url, publicId } = await uploadFileToCloudinary(file, folder, onProgress);

  return {
    key: publicId,
    cdnUrl: url,
    publicId,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
  };
}

/**
 * Creates a thumbnail preview URL from a File object (client-side only).
 */
export function createLocalPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a local preview URL to free memory.
 */
export function revokeLocalPreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Formats file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
