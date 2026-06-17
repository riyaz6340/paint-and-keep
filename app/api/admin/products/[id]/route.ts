/**
 * Paint & Keep - Admin Single Product API Route
 *
 * GET /api/admin/products/[id] - Get product details (admin view)
 * PATCH /api/admin/products/[id] - Update a product
 * DELETE /api/admin/products/[id] - Delete a product (with pending-order warning)
 *
 * Protected by admin auth middleware.
 * Requirements: 15.1, 15.5, 15.7, 15.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { ProductService, type UpdateProductData } from '@/lib/services/product-service';
import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import type { AgeGroup, DifficultyLevel } from '@prisma/client';

const VALID_AGE_GROUPS: AgeGroup[] = ['AGES_4_6', 'AGES_7_9', 'AGES_10_12', 'TEENS', 'ADULTS', 'FAMILY'];
const VALID_DIFFICULTY_LEVELS: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

/**
 * GET /api/admin/products/[id]
 * Get full product details for admin editing.
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;
      if (!id) throw badRequest('Product ID is required');

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            select: { id: true, url: true, alt: true, order: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!product) {
        throw notFound(`Product not found: ${id}`);
      }

      // Get pending order count for delete warning
      const pendingOrders = await prisma.orderItem.count({
        where: {
          productId: id,
          order: {
            status: { in: ['PENDING', 'PAID', 'PROCESSING'] },
          },
        },
      });

      return NextResponse.json({
        ...product,
        price: Number(product.price),
        averageRating: Number(product.averageRating),
        pendingOrders,
        isLowStock: product.stock > 0 && product.stock <= product.lowStockThreshold,
        isOutOfStock: product.stock === 0,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);

/**
 * PATCH /api/admin/products/[id]
 * Update a product with validation.
 */
export const PATCH = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;
      if (!id) throw badRequest('Product ID is required');

      const body = await request.json();
      const errors: Record<string, string> = {};

      // Validate fields that are provided
      if (body.name !== undefined) {
        if (typeof body.name !== 'string' || body.name.trim().length === 0) {
          errors.name = 'Name cannot be empty';
        } else if (body.name.trim().length > 200) {
          errors.name = 'Name must not exceed 200 characters';
        }
      }

      if (body.description !== undefined) {
        if (typeof body.description !== 'string' || body.description.trim().length === 0) {
          errors.description = 'Description cannot be empty';
        } else if (body.description.trim().length > 5000) {
          errors.description = 'Description must not exceed 5000 characters';
        }
      }

      if (body.price !== undefined) {
        if (isNaN(Number(body.price)) || Number(body.price) < 0.01 || Number(body.price) > 999999.99) {
          errors.price = 'Price must be between 0.01 and 999,999.99';
        }
      }

      if (body.categoryId !== undefined) {
        if (typeof body.categoryId !== 'string' || body.categoryId.length === 0) {
          errors.categoryId = 'Category is required';
        } else {
          const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
          if (!category) {
            errors.categoryId = 'Category not found';
          }
        }
      }

      if (body.ageGroup !== undefined && !VALID_AGE_GROUPS.includes(body.ageGroup)) {
        errors.ageGroup = `Age group must be one of: ${VALID_AGE_GROUPS.join(', ')}`;
      }

      if (body.difficultyLevel !== undefined && !VALID_DIFFICULTY_LEVELS.includes(body.difficultyLevel)) {
        errors.difficultyLevel = `Difficulty level must be one of: ${VALID_DIFFICULTY_LEVELS.join(', ')}`;
      }

      if (body.seoTitle !== undefined && body.seoTitle && body.seoTitle.length > 60) {
        errors.seoTitle = 'SEO title must not exceed 60 characters';
      }

      if (body.seoDescription !== undefined && body.seoDescription && body.seoDescription.length > 160) {
        errors.seoDescription = 'SEO description must not exceed 160 characters';
      }

      if (body.images !== undefined && Array.isArray(body.images) && body.images.length > 10) {
        errors.images = 'Maximum 10 images allowed per product';
      }

      if (body.stock !== undefined && (isNaN(Number(body.stock)) || Number(body.stock) < 0 || Number(body.stock) > 999999)) {
        errors.stock = 'Stock must be between 0 and 999,999';
      }

      if (Object.keys(errors).length > 0) {
        throw badRequest('Validation failed', { errors });
      }

      // Build update data
      const updateData: UpdateProductData = {};

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.description !== undefined) updateData.description = body.description.trim();
      if (body.price !== undefined) updateData.price = Number(body.price);
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
      if (body.ageGroup !== undefined) updateData.ageGroup = body.ageGroup as AgeGroup;
      if (body.difficultyLevel !== undefined) updateData.difficultyLevel = body.difficultyLevel as DifficultyLevel;
      if (body.stock !== undefined) updateData.stock = Number(body.stock);
      if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(body.lowStockThreshold);
      if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);
      if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
      if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle?.trim() || undefined;
      if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription?.trim() || undefined;
      if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl?.trim() || undefined;
      if (body.images !== undefined) updateData.images = body.images;

      const product = await ProductService.updateProduct(id, updateData);

      return NextResponse.json(product);
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);

/**
 * DELETE /api/admin/products/[id]
 * Delete a product. Returns warning if pending orders exist.
 * Requires `confirmDelete=true` query param to proceed when pending orders exist.
 */
export const DELETE = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;
      if (!id) throw badRequest('Product ID is required');

      const { searchParams } = request.nextUrl;
      const confirmDelete = searchParams.get('confirmDelete') === 'true';

      // Check for pending orders
      const pendingOrders = await prisma.orderItem.count({
        where: {
          productId: id,
          order: {
            status: { in: ['PENDING', 'PAID', 'PROCESSING'] },
          },
        },
      });

      // If pending orders exist and not confirmed, return warning
      if (pendingOrders > 0 && !confirmDelete) {
        return NextResponse.json(
          {
            warning: true,
            message: `This product has ${pendingOrders} pending order(s). Are you sure you want to delete it?`,
            pendingOrders,
            requiresConfirmation: true,
          },
          { status: 200 }
        );
      }

      // If confirmed or no pending orders, proceed with deletion
      const result = await ProductService.deleteProduct(id);

      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);
