/**
 * Paint & Keep - Gallery API Route
 *
 * GET /api/gallery - List approved gallery photos with filters and cursor-based pagination.
 *
 * Query Parameters:
 * - ageGroup: filter by age group tag
 * - theme: filter by theme tag
 * - occasion: filter by occasion tag
 * - date: filter photos from this date onwards (ISO string)
 * - location: filter by location tag
 * - cursor: cursor ID for infinite scroll pagination
 * - limit: items per batch (default 20)
 *
 * Returns photos with `hasMore` flag for infinite scroll.
 *
 * Requirements: 7.1, 7.2, 7.5
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { GalleryService } from '@/lib/services/gallery-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse query parameters
    const ageGroup = searchParams.get('ageGroup') || undefined;
    const theme = searchParams.get('theme') || undefined;
    const occasion = searchParams.get('occasion') || undefined;
    const date = searchParams.get('date') || undefined;
    const location = searchParams.get('location') || undefined;
    const cursor = searchParams.get('cursor') || undefined;
    const limitStr = searchParams.get('limit') || '20';

    // Validate limit
    const limit = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 20));

    // Validate date format if provided
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw badRequest('Invalid date format. Use ISO 8601 format (e.g., 2024-01-01)');
      }
    }

    const result = await GalleryService.listPhotos({
      filters: { ageGroup, theme, occasion, date, location },
      cursor,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
