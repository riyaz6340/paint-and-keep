'use client';

import { useCallback, useRef, useState } from 'react';
import {
  validateImage,
  uploadImage,
  createLocalPreviewUrl,
  revokeLocalPreviewUrl,
  formatFileSize,
  type UploadProgress,
  type UploadResult,
} from '@/lib/image-upload';
import { ALLOWED_IMAGE_TYPES, DEFAULT_MAX_FILE_SIZE } from '@/lib/cloudinary-constants';

export interface ImageUploaderProps {
  /** Maximum number of files allowed (default: 1) */
  maxFiles?: number;
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Accepted MIME types (default: JPEG, PNG, WebP) */
  formats?: readonly string[];
  /** Cloudinary folder for uploads (default: 'uploads') */
  folder?: string;
  /** Callback when upload(s) complete successfully */
  onUpload?: (results: UploadResult[]) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Custom label text */
  label?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
}

interface FileState {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  result?: UploadResult;
}

/**
 * Reusable image uploader component with drag-and-drop support,
 * file validation, upload progress, and thumbnail previews.
 *
 * Uploads to Cloudinary via /api/upload endpoint.
 * Accessible: keyboard navigable, ARIA labels, focus indicators.
 */
export function ImageUploader({
  maxFiles = 1,
  maxSize = DEFAULT_MAX_FILE_SIZE,
  formats = ALLOWED_IMAGE_TYPES,
  folder = 'uploads',
  onUpload,
  onError,
  label = 'Upload Images',
  disabled = false,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
  const formatLabels = formats
    .map((f) => f.replace('image/', '').toUpperCase())
    .join(', ');

  const handleFiles = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles);

      // Check max files limit
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) {
        onError?.(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);

      // Validate and create file states
      const newFileStates: FileState[] = [];

      for (const file of filesToProcess) {
        const validation = validateImage(file, {
          allowedTypes: formats,
          maxSize,
        });

        if (!validation.valid) {
          onError?.(validation.error || 'Invalid file');
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const previewUrl = createLocalPreviewUrl(file);

        newFileStates.push({
          id,
          file,
          previewUrl,
          progress: 0,
          status: 'pending',
        });
      }

      if (newFileStates.length === 0) return;

      setFiles((prev) => [...prev, ...newFileStates]);

      // Upload files
      const results: UploadResult[] = [];

      for (const fileState of newFileStates) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileState.id ? { ...f, status: 'uploading' } : f
          )
        );

        try {
          const result = await uploadImage(fileState.file, {
            folder,
            validationOptions: { allowedTypes: formats, maxSize },
            onProgress: (progress: UploadProgress) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileState.id
                    ? { ...f, progress: progress.percent }
                    : f
                )
              );
            },
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileState.id
                ? { ...f, status: 'complete', progress: 100, result }
                : f
            )
          );

          results.push(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed';

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileState.id
                ? { ...f, status: 'error', error: errorMessage }
                : f
            )
          );

          onError?.(errorMessage);
        }
      }

      if (results.length > 0) {
        onUpload?.(results);
      }
    },
    [files.length, maxFiles, maxSize, formats, folder, onUpload, onError]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles);
      }
      // Reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFiles]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        revokeLocalPreviewUrl(file.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const canAddMore = files.length < maxFiles && !disabled;

  return (
    <div className="w-full" role="group" aria-labelledby="image-uploader-label">
      <label
        id="image-uploader-label"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {/* Drop zone */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Drop files here or click to browse. Accepts ${formatLabels} up to ${maxMB}MB. ${maxFiles - files.length} file(s) remaining.`}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : disabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
        >
          {/* Upload icon */}
          <svg
            className={`mb-3 h-10 w-10 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="mb-1 text-sm text-gray-600">
            {isDragOver ? (
              <span className="font-semibold text-blue-600">
                Drop files here
              </span>
            ) : (
              <>
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {formatLabels} (max {maxMB}MB per file)
          </p>
          {maxFiles > 1 && (
            <p className="mt-1 text-xs text-gray-400">
              {files.length}/{maxFiles} files uploaded
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={formats.join(',')}
            multiple={maxFiles > 1}
            onChange={handleInputChange}
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      )}

      {/* File list with previews and progress */}
      {files.length > 0 && (
        <ul
          className="mt-4 space-y-3"
          aria-label="Uploaded files"
          role="list"
        >
          {files.map((fileState) => (
            <li
              key={fileState.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              {/* Thumbnail preview */}
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileState.previewUrl}
                  alt={`Preview of ${fileState.file.name}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* File info and progress */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">
                  {fileState.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileState.file.size)}
                </p>

                {/* Progress bar */}
                {fileState.status === 'uploading' && (
                  <div
                    className="mt-1.5"
                    role="progressbar"
                    aria-valuenow={fileState.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${fileState.file.name}: ${fileState.progress}%`}
                  >
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${fileState.progress}%` }}
                      />
                    </div>
                    <span className="mt-0.5 text-xs text-gray-500">
                      {fileState.progress}%
                    </span>
                  </div>
                )}

                {/* Error message */}
                {fileState.status === 'error' && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {fileState.error}
                  </p>
                )}

                {/* Success indicator */}
                {fileState.status === 'complete' && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Uploaded successfully
                  </p>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(fileState.id)}
                className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Remove ${fileState.file.name}`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
