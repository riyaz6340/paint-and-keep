/**
 * Paint & Keep - Products API Route
 *
 * GET /api/products - List products with filtering, sorting, search, and pagination.
 *
 * Query Parameters:
 * - category: filter by category slug
 * - ageGroup: filter by age group enum
 * - theme: filter by theme keyword
 * - priceMin: minimum price filter
 * - priceMax: maximum price filter
 * - sort: newest | popular | priceLow | priceHigh
 * - search: text search (min 2 chars)
 * - page: page number (default 1)
 * - limit: items per page (default 20)
 *
 * Uses Redis caching with 60s TTL.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService, type ProductSortOption } from '@/lib/services/product-service';
import { handleApiError, badRequest } from '@/lib/api-error';

const VALID_SORT_OPTIONS: ProductSortOption[] = ['newest', 'popular', 'priceLow', 'priceHigh'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse query parameters
    const category = searchParams.get('category') || undefined;
    const ageGroup = searchParams.get('ageGroup') || undefined;
    const theme = searchParams.get('theme') || undefined;
    const priceMinStr = searchParams.get('priceMin');
    const priceMaxStr = searchParams.get('priceMax');
    const sortParam = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || undefined;
    const pageStr = searchParams.get('page') || '1';
    const limitStr = searchParams.get('limit') || '20';

    // Validate sort option
    if (!VALID_SORT_OPTIONS.includes(sortParam as ProductSortOption)) {
      throw badRequest(`Invalid sort option. Must be one of: ${VALID_SORT_OPTIONS.join(', ')}`);
    }

    // Validate search (min 2 chars if provided)
    if (search && search.length < 2) {
      throw badRequest('Search query must be at least 2 characters');
    }

    // Parse numeric params
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const priceMin = priceMinStr ? parseFloat(priceMinStr) : undefined;
    const priceMax = priceMaxStr ? parseFloat(priceMaxStr) : undefined;

    // Validate price range
    if (priceMin !== undefined && isNaN(priceMin)) {
      throw badRequest('priceMin must be a valid number');
    }
    if (priceMax !== undefined && isNaN(priceMax)) {
      throw badRequest('priceMax must be a valid number');
    }
    if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
      throw badRequest('priceMin cannot be greater than priceMax');
    }

    const result = await ProductService.listProducts({
      filters: { category, ageGroup, theme, priceMin, priceMax },
      sort: sortParam as ProductSortOption,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
