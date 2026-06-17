/**
 * Paint & Keep - Account Wishlist API
 *
 * GET    /api/account/wishlist - Get wishlist items (paginated)
 * POST   /api/account/wishlist - Add product to wishlist
 * DELETE /api/account/wishlist - Remove product from wishlist
 *
 * Requirements: 29.5
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest, conflict, notFound } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

const MAX_WISHLIST_ITEMS = 200;
const WISHLIST_PER_PAGE = 20;

/**
 * GET /api/account/wishlist?page=1
 * Returns paginated wishlist items with product details.
 */
const getWishlist: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const [items, totalCount] = await Promise.all([
      prisma.wishlistItem.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              stock: true,
              isPublished: true,
              images: {
                take: 1,
                orderBy: { order: 'asc' },
                select: { url: true, alt: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * WISHLIST_PER_PAGE,
        take: WISHLIST_PER_PAGE,
      }),
      prisma.wishlistItem.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(totalCount / WISHLIST_PER_PAGE);

    return NextResponse.json({
      items,
      pagination: {
        page,
        perPage: WISHLIST_PER_PAGE,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      maxAllowed: MAX_WISHLIST_ITEMS,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * POST /api/account/wishlist
 * Add a product to the wishlist. Max 200 items.
 */
const addToWishlist: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const body = await request.json();

    const { productId } = body;

    if (!productId || typeof productId !== 'string') {
      throw badRequest('Product ID is required');
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true },
    });

    if (!product || !product.isPublished) {
      throw notFound('Product not found');
    }

    // Check wishlist limit
    const currentCount = await prisma.wishlistItem.count({ where: { userId } });
    if (currentCount >= MAX_WISHLIST_ITEMS) {
      throw badRequest(`Wishlist is full. Maximum ${MAX_WISHLIST_ITEMS} items allowed.`);
    }

    // Check for duplicate
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      throw conflict('Product is already in your wishlist');
    }

    const item = await prisma.wishlistItem.create({
      data: { userId, productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
              select: { url: true, alt: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * DELETE /api/account/wishlist
 * Remove a product from the wishlist.
 * Body: { productId: string }
 */
const removeFromWishlist: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      throw badRequest('Product ID is required (pass as ?productId=...)');
    }

    // Verify item exists
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!existing) {
      throw notFound('Item not in wishlist');
    }

    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });

    return NextResponse.json({ message: 'Removed from wishlist' });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuthRequired(getWishlist);
export const POST = withAuthRequired(addToWishlist);
export const DELETE = withAuthRequired(removeFromWishlist);
