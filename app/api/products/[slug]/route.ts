/**
 * Paint & Keep - Product Detail API Route
 *
 * GET /api/products/[slug] - Get full product detail with related products and reviews.
 *
 * Query Parameters:
 * - reviewPage: page number for reviews (default 1)
 * - reviewLimit: reviews per page (default 10)
 *
 * Returns:
 * - product: full product with images and category
 * - relatedProducts: 4-8 products from the same category
 * - reviews: paginated reviews with user info and photos
 *
 * Requirements: 4.4, 4.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import { handleApiError } from '@/lib/api-error';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = request.nextUrl;

    // Parse review pagination params
    const reviewPage = Math.max(1, parseInt(searchParams.get('reviewPage') || '1', 10) || 1);
    const reviewLimit = Math.min(50, Math.max(1, parseInt(searchParams.get('reviewLimit') || '10', 10) || 10));

    // Get full product detail
    const product = await ProductService.getProductBySlug(slug);

    // Get related products (4-8 from same category)
    const relatedProducts = await ProductService.getRelatedProducts(
      product.id,
      product.category.id,
      8
    );

    // Get paginated reviews
    const reviews = await ProductService.getProductReviews(
      product.id,
      reviewPage,
      reviewLimit
    );

    return NextResponse.json({
      product,
      relatedProducts,
      reviews,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
