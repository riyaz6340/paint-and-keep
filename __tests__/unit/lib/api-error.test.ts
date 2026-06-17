import { describe, it, expect } from 'vitest';
import {
  ApiError,
  handleApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
} from '@/lib/api-error';

describe('ApiError', () => {
  it('creates an error with all properties', () => {
    const error = new ApiError({
      code: 'TEST_ERROR',
      message: 'Something went wrong',
      statusCode: 422,
      details: { field: 'email' },
      retryable: false,
    });

    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual({ field: 'email' });
    expect(error.retryable).toBe(false);
    expect(error.name).toBe('ApiError');
  });

  it('defaults retryable to false', () => {
    const error = new ApiError({
      code: 'TEST',
      message: 'test',
      statusCode: 400,
    });
    expect(error.retryable).toBe(false);
  });

  it('converts to JSON correctly', () => {
    const error = new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      statusCode: 400,
      details: { fields: ['email', 'phone'] },
      retryable: false,
    });

    const json = error.toJSON();
    expect(json).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { fields: ['email', 'phone'] },
      retryable: false,
    });
  });

  it('omits details from JSON when not provided', () => {
    const error = new ApiError({
      code: 'NOT_FOUND',
      message: 'Not found',
      statusCode: 404,
    });

    const json = error.toJSON();
    expect(json).not.toHaveProperty('details');
  });
});

describe('handleApiError', () => {
  it('handles ApiError instances', async () => {
    const error = new ApiError({
      code: 'BAD_REQUEST',
      message: 'Invalid data',
      statusCode: 400,
      retryable: false,
    });

    const response = handleApiError(error);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.message).toBe('Invalid data');
  });

  it('handles unknown errors as 500', async () => {
    const response = handleApiError(new Error('unexpected'));
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.retryable).toBe(true);
  });

  it('handles non-Error objects', async () => {
    const response = handleApiError('string error');
    expect(response.status).toBe(500);
  });

  it('handles null/undefined', async () => {
    const response = handleApiError(null);
    expect(response.status).toBe(500);
  });
});

describe('error factory functions', () => {
  it('badRequest creates 400 error', () => {
    const error = badRequest('Invalid email', { field: 'email' });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('unauthorized creates 401 error', () => {
    const error = unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('forbidden creates 403 error', () => {
    const error = forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('notFound creates 404 error', () => {
    const error = notFound('Product not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Product not found');
  });

  it('conflict creates 409 error', () => {
    const error = conflict('Already exists');
    expect(error.statusCode).toBe(409);
  });

  it('tooManyRequests creates 429 error with retry info', () => {
    const error = tooManyRequests(60);
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ retryAfter: 60 });
  });

  it('internalError creates 500 error', () => {
    const error = internalError();
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(true);
  });
});
