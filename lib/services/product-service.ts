/**
 * Paint & Keep - Product Service
 *
 * Provides CRUD operations, slug generation, stock management,
 * and product listing with filters, sorting, search, and pagination.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 4.4, 4.5
 */

import prisma from '@/lib/prisma';
import { cacheGetOrSet, cacheInvalidatePattern } from '@/lib/cache';
import { notFound, conflict, badRequest } from '@/lib/api-error';
import type { AgeGroup, DifficultyLevel } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ProductFilters {
  category?: string;
  ageGroup?: string;
  theme?: string;
  priceMin?: number;
  priceMax?: number;
}

export type ProductSortOption = 'newest' | 'popular' | 'priceLow' | 'priceHigh';

export interface ListProductsParams {
  filters?: ProductFilters;
  sort?: ProductSortOption;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductListResult {
  products: ProductSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  stock: number;
  ageGroup: string;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: { url: string; alt: string }[];
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  ageGroup: string;
  difficultyLevel: string;
  stock: number;
  lowStockThreshold: number;
  averageRating: number;
  reviewCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  videoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; alt: string; order: number }[];
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  ageGroup: AgeGroup;
  difficultyLevel: DifficultyLevel;
  stock?: number;
  lowStockThreshold?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  videoUrl?: string;
  images?: { url: string; alt: string; order: number }[];
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  ageGroup?: AgeGroup;
  difficultyLevel?: DifficultyLevel;
  stock?: number;
  lowStockThreshold?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  videoUrl?: string;
  images?: { url: string; alt: string; order: number }[];
}

// ─── Slug Generation ───────────────────────────────────────────────────────────

/**
 * Generate a URL-friendly slug from a product name.
 * Converts to kebab-case and ensures uniqueness by appending a suffix if needed.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/[\s_]+/g, '-') // spaces/underscores to hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

// ─── Sorting ───────────────────────────────────────────────────────────────────

function getSortOrder(sort?: ProductSortOption): any {
  switch (sort) {
    case 'popular':
      return { reviewCount: 'desc' };
    case 'priceLow':
      return { price: 'asc' };
    case 'priceHigh':
      return { price: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

// ─── Product Service ───────────────────────────────────────────────────────────

export const ProductService = {
  /**
   * List products with filtering, sorting, search, and pagination.
   * Results are cached in Redis with a 60s TTL.
   */
  async listProducts(params: ListProductsParams = {}): Promise<ProductListResult> {
    const { filters = {}, sort = 'newest', search, page = 1, limit = 20 } = params;

    // Build cache key from all query params
    const cacheKey = buildProductListCacheKey(params);

    return cacheGetOrSet<ProductListResult>(
      cacheKey,
      async () => {
        const where = buildWhereClause(filters, search);
        const orderBy = getSortOrder(sort);
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
              averageRating: true,
              reviewCount: true,
              stock: true,
              ageGroup: true,
              isFeatured: true,
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

        return {
          products: products.map((p) => ({
            ...p,
            price: Number(p.price),
            averageRating: Number(p.averageRating),
          })),
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      },
      60 // 60s TTL
    );
  },

  /**
   * Get a single product by slug with full detail including images and category.
   */
  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          select: { id: true, url: true, alt: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw notFound(`Product not found: ${slug}`);
    }

    return {
      ...product,
      price: Number(product.price),
      averageRating: Number(product.averageRating),
    };
  },

  /**
   * Get related products from the same category, excluding the current product.
   * Returns 4-8 products.
   */
  async getRelatedProducts(
    productId: string,
    categoryId: string,
    limit: number = 8
  ): Promise<ProductSummary[]> {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: productId },
        isPublished: true,
      },
      take: limit,
      orderBy: { reviewCount: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        averageRating: true,
        reviewCount: true,
        stock: true,
        ageGroup: true,
        isFeatured: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          select: { url: true, alt: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    return products.map((p) => ({
      ...p,
      price: Number(p.price),
      averageRating: Number(p.averageRating),
    }));
  },

  /**
   * Get paginated reviews for a product.
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          status: 'APPROVED',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          user: { select: { id: true, name: true, profileImage: true } },
          photos: { select: { id: true, url: true } },
        },
      }),
      prisma.review.count({
        where: { productId, status: 'APPROVED' },
      }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Create a new product (admin).
   */
  async createProduct(data: CreateProductData) {
    const slug = await ensureUniqueSlug(generateSlug(data.name));

    const { images, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        stock: data.stock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        isPublished: data.isPublished ?? false,
        isFeatured: data.isFeatured ?? false,
        ...(images && {
          images: {
            create: images.map((img) => ({
              url: img.url,
              alt: img.alt,
              order: img.order,
            })),
          },
        }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true, alt: true, order: true } },
      },
    });

    // Invalidate product list cache
    await cacheInvalidatePattern('products:list:*');

    return {
      ...product,
      price: Number(product.price),
      averageRating: Number(product.averageRating),
    };
  },

  /**
   * Update an existing product (admin).
   */
  async updateProduct(id: string, data: UpdateProductData) {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, slug: true, name: true },
    });

    if (!existing) {
      throw notFound(`Product not found: ${id}`);
    }

    const { images, ...updateData } = data;

    // If name changed, regenerate slug
    let slug: string | undefined;
    if (data.name && data.name !== existing.name) {
      slug = await ensureUniqueSlug(generateSlug(data.name), id);
    }

    const product = await prisma.$transaction(async (tx) => {
      // Update images if provided
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: images.map((img) => ({
            productId: id,
            url: img.url,
            alt: img.alt,
            order: img.order,
          })),
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(slug && { slug }),
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true, alt: true, order: true } },
        },
      });
    });

    // Invalidate caches
    await cacheInvalidatePattern('products:*');

    return {
      ...product,
      price: Number(product.price),
      averageRating: Number(product.averageRating),
    };
  },

  /**
   * Delete a product (admin). Checks for pending orders first.
   */
  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      throw notFound(`Product not found: ${id}`);
    }

    // Check for pending orders containing this product
    const pendingOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { in: ['PENDING', 'PAID', 'PROCESSING'] },
        },
      },
    });

    if (pendingOrders > 0) {
      throw conflict(
        `Cannot delete product "${product.name}" with ${pendingOrders} pending order(s)`,
        { pendingOrders }
      );
    }

    await prisma.product.delete({ where: { id } });

    // Invalidate caches
    await cacheInvalidatePattern('products:*');

    return { success: true, deletedId: id };
  },

  /**
   * Update stock quantity for a product.
   */
  async updateStock(id: string, quantity: number) {
    if (quantity < 0) {
      throw badRequest('Stock quantity cannot be negative');
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, lowStockThreshold: true },
    });

    if (!product) {
      throw notFound(`Product not found: ${id}`);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: quantity },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    // Invalidate product caches since stock changed
    await cacheInvalidatePattern('products:*');

    return {
      ...updated,
      isLowStock: updated.stock <= updated.lowStockThreshold,
      isOutOfStock: updated.stock === 0,
    };
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildWhereClause(
  filters: ProductFilters,
  search?: string
): any {
  const where: any = {
    isPublished: true,
  };

  // Category filter (by slug)
  if (filters.category) {
    where.category = { slug: filters.category };
  }

  // Age group filter
  if (filters.ageGroup) {
    where.ageGroup = filters.ageGroup as AgeGroup;
  }

  // Theme filter (searches category name as theme proxy)
  if (filters.theme) {
    where.category = {
      ...((where.category as any) || {}),
      name: { contains: filters.theme, mode: 'insensitive' },
    };
  }

  // Price range filter
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {};
    if (filters.priceMin !== undefined) {
      where.price.gte = filters.priceMin;
    }
    if (filters.priceMax !== undefined) {
      where.price.lte = filters.priceMax;
    }
  }

  // Text search (min 2 chars)
  if (search && search.length >= 2) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildProductListCacheKey(params: ListProductsParams): string {
  const { filters = {}, sort = 'newest', search, page = 1, limit = 20 } = params;

  const parts = [
    'products:list',
    `p${page}`,
    `l${limit}`,
    `s${sort}`,
  ];

  if (filters.category) parts.push(`cat:${filters.category}`);
  if (filters.ageGroup) parts.push(`age:${filters.ageGroup}`);
  if (filters.theme) parts.push(`theme:${filters.theme}`);
  if (filters.priceMin !== undefined) parts.push(`pmin:${filters.priceMin}`);
  if (filters.priceMax !== undefined) parts.push(`pmax:${filters.priceMax}`);
  if (search) parts.push(`q:${search}`);

  return parts.join(':');
}
