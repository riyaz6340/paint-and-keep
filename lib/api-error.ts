/**
 * Paint & Keep - Structured API Error Response
 *
 * Provides a consistent error format for all API routes.
 * Includes error code, HTTP status, human-readable message,
 * optional details, and retryable flag for client resilience.
 *
 * Requirements: 26.6 (structured error handling)
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/**
 * Custom API error class with structured response data.
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(options: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
    retryable?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
  }

  /**
   * Convert to structured JSON response body.
   */
  toJSON(): ApiErrorResponse {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      retryable: this.retryable,
    };
  }
}

/**
 * Convert any error into a structured NextResponse.
 * Known ApiError instances preserve their status and details.
 * Unknown errors are wrapped as 500 Internal Server Error.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Log unexpected errors for debugging
  console.error('[API Error] Unexpected error:', error);

  const fallback: ApiErrorResponse = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    retryable: true,
  };

  return NextResponse.json(fallback, { status: 500 });
}

// Common error factory functions for convenience

export function badRequest(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError({
    code: 'BAD_REQUEST',
    message,
    statusCode: 400,
    details,
    retryable: false,
  });
}

export function unauthorized(message: string = 'Authentication required'): ApiError {
  return new ApiError({
    code: 'UNAUTHORIZED',
    message,
    statusCode: 401,
    retryable: false,
  });
}

export function forbidden(message: string = 'Access denied'): ApiError {
  return new ApiError({
    code: 'FORBIDDEN',
    message,
    statusCode: 403,
    retryable: false,
  });
}

export function notFound(message: string = 'Resource not found'): ApiError {
  return new ApiError({
    code: 'NOT_FOUND',
    message,
    statusCode: 404,
    retryable: false,
  });
}

export function conflict(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError({
    code: 'CONFLICT',
    message,
    statusCode: 409,
    details,
    retryable: false,
  });
}

export function tooManyRequests(retryAfter?: number): ApiError {
  return new ApiError({
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    statusCode: 429,
    details: retryAfter ? { retryAfter } : undefined,
    retryable: true,
  });
}

export function internalError(message: string = 'Internal server error'): ApiError {
  return new ApiError({
    code: 'INTERNAL_ERROR',
    message,
    statusCode: 500,
    retryable: true,
  });
}
