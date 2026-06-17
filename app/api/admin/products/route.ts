/**
 * Paint & Keep - Admin Products API Route
 *
 * GET /api/admin/products - List all products (admin view, includes unpublished)
 * POST /api/admin/products - Create a new product
 *
 * Protected by admin auth middleware.
 * Requirements: 15.1, 15.5, 15.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { ProductService, type CreateProductData } from '@/lib/services/product-service';
import { handleApiError, badRequest } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import type { AgeGroup, DifficultyLevel } from '@prisma/client';

const VALID_AGE_GROUPS: AgeGroup[] = ['AGES_4_6', 'AGES_7_9', 'AGES_10_12', 'TEENS', 'ADULTS', 'FAMILY'];
const VALID_DIFFICULTY_LEVELS: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

/**
 * GET /api/admin/products
 * Lists all products (including unpublished) with filtering, sorting, and pagination.
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = request.nextUrl;

      const category = searchParams.get('category') || undefined;
      const ageGroup = searchParams.get('ageGroup') || undefined;
      const status = searchParams.get('status') || undefined; // published, draft, out_of_stock, low_stock
      const search = searchParams.get('search') || undefined;
      const sortKey = searchParams.get('sortKey') || 'createdAt';
      const sortDir = searchParams.get('sortDir') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

      // Build where clause (admin view: includes unpublished)
      const where: Record<string, any> = {};

      if (category) {
        where.category = { slug: category };
      }

      if (ageGroup && VALID_AGE_GROUPS.includes(ageGroup as AgeGroup)) {
        where.ageGroup = ageGroup as AgeGroup;
      }

      // Status filter
      if (status === 'published') {
        where.isPublished = true;
      } else if (status === 'draft') {
        where.isPublished = false;
      } else if (status === 'out_of_stock') {
        where.stock = 0;
      } else if (status === 'low_stock') {
        // Products where stock <= lowStockThreshold AND stock > 0
        where.AND = [
          { stock: { gt: 0 } },
          {
            // Use raw filter for self-referencing column comparison
            // Simplified: use a reasonable default threshold
          },
        ];
        // Since Prisma can't easily compare two columns, we'll use a raw approach
        // For now, use threshold default of 10
        where.stock = { gt: 0, lte: 10 };
        delete where.AND;
      }

      // Text search
      if (search && search.length >= 1) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build sort
      const validSortKeys = ['name', 'price', 'stock', 'createdAt', 'updatedAt'];
      const orderByKey = validSortKeys.includes(sortKey) ? sortKey : 'createdAt';
      const orderByDir = sortDir === 'asc' ? 'asc' : 'desc';
      const orderBy: Record<string, any> = {
        [orderByKey]: orderByDir,
      };

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            slug: true,
            name: true,
            price: true,
            stock: true,
            lowStockThreshold: true,
            ageGroup: true,
            isPublished: true,
            isFeatured: true,
            createdAt: true,
            updatedAt: true,
            category: { select: { id: true, name: true, slug: true } },
            images: {
              select: { url: true, alt: true },
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      const formattedProducts = products.map((p) => ({
        ...p,
        price: Number(p.price),
        isLowStock: p.stock > 0 && p.stock <= p.lowStockThreshold,
        isOutOfStock: p.stock === 0,
        status: p.stock === 0 ? 'out_of_stock' : p.isPublished ? 'published' : 'draft',
      }));

      return NextResponse.json({
        products: formattedProducts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);

/**
 * POST /api/admin/products
 * Create a new product with validation.
 */
export const POST = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      // Validate required fields
      const errors: Record<string, string> = {};

      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        errors.name = 'Name is required';
      } else if (body.name.trim().length > 200) {
        errors.name = 'Name must not exceed 200 characters';
      }

      if (!body.description || typeof body.description !== 'string' || body.description.trim().length === 0) {
        errors.description = 'Description is required';
      } else if (body.description.trim().length > 5000) {
        errors.description = 'Description must not exceed 5000 characters';
      }

      if (body.price === undefined || body.price === null || isNaN(Number(body.price))) {
        errors.price = 'Price is required';
      } else if (Number(body.price) < 0.01 || Number(body.price) > 999999.99) {
        errors.price = 'Price must be between 0.01 and 999,999.99';
      }

      if (!body.categoryId || typeof body.categoryId !== 'string') {
        errors.categoryId = 'Category is required';
      }

      if (!body.ageGroup || !VALID_AGE_GROUPS.includes(body.ageGroup)) {
        errors.ageGroup = `Age group must be one of: ${VALID_AGE_GROUPS.join(', ')}`;
      }

      if (!body.difficultyLevel || !VALID_DIFFICULTY_LEVELS.includes(body.difficultyLevel)) {
        errors.difficultyLevel = `Difficulty level must be one of: ${VALID_DIFFICULTY_LEVELS.join(', ')}`;
      }

      // Optional validations
      if (body.seoTitle && body.seoTitle.length > 60) {
        errors.seoTitle = 'SEO title must not exceed 60 characters';
      }

      if (body.seoDescription && body.seoDescription.length > 160) {
        errors.seoDescription = 'SEO description must not exceed 160 characters';
      }

      if (body.images && Array.isArray(body.images) && body.images.length > 10) {
        errors.images = 'Maximum 10 images allowed per product';
      }

      if (body.stock !== undefined && (isNaN(Number(body.stock)) || Number(body.stock) < 0 || Number(body.stock) > 999999)) {
        errors.stock = 'Stock must be between 0 and 999,999';
      }

      if (Object.keys(errors).length > 0) {
        throw badRequest('Validation failed', { errors });
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });

      if (!category) {
        throw badRequest('Category not found');
      }

      // Create product
      const productData: CreateProductData = {
        name: body.name.trim(),
        description: body.description.trim(),
        price: Number(body.price),
        categoryId: body.categoryId,
        ageGroup: body.ageGroup as AgeGroup,
        difficultyLevel: body.difficultyLevel as DifficultyLevel,
        stock: body.stock !== undefined ? Number(body.stock) : 0,
        lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : 10,
        isPublished: body.isPublished ?? false,
        isFeatured: body.isFeatured ?? false,
        seoTitle: body.seoTitle?.trim() || undefined,
        seoDescription: body.seoDescription?.trim() || undefined,
        videoUrl: body.videoUrl?.trim() || undefined,
        images: body.images || undefined,
      };

      const product = await ProductService.createProduct(productData);

      return NextResponse.json(product, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);
