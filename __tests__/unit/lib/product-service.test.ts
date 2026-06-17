/**
 * Unit tests for ProductService
 *
 * Tests slug generation, listing, detail fetching, CRUD operations,
 * and stock management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../../utils';
import { ProductService, generateSlug } from '@/lib/services/product-service';

// Mock the cache module to bypass Redis in unit tests
vi.mock('@/lib/cache', () => ({
  cacheGetOrSet: vi.fn(async (_key: string, factory: () => Promise<unknown>) => factory()),
  cacheInvalidatePattern: vi.fn(async () => 0),
}));

beforeEach(() => {
  resetPrismaMock();
});

// ─── Slug Generation ───────────────────────────────────────────────────────────

describe('generateSlug', () => {
  it('converts name to kebab-case', () => {
    expect(generateSlug('Unicorn Paint Kit')).toBe('unicorn-paint-kit');
  });

  it('removes special characters', () => {
    expect(generateSlug('Dragon & Phoenix Kit!')).toBe('dragon-phoenix-kit');
  });

  it('handles multiple spaces and underscores', () => {
    expect(generateSlug('Hello   World_Test')).toBe('hello-world-test');
  });

  it('trims leading/trailing whitespace', () => {
    expect(generateSlug('  spaced out  ')).toBe('spaced-out');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('multi---hyphens')).toBe('multi-hyphens');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });
});

// ─── listProducts ──────────────────────────────────────────────────────────────

describe('ProductService.listProducts', () => {
  const mockProducts = [
    {
      id: 'prod-1',
      slug: 'unicorn-kit',
      name: 'Unicorn Kit',
      price: { toNumber: () => 29.99 } as unknown as number,
      averageRating: { toNumber: () => 4.5 } as unknown as number,
      reviewCount: 12,
      stock: 50,
      ageGroup: 'AGES_4_6',
      isFeatured: true,
      category: { id: 'cat-1', name: 'Animals', slug: 'animals' },
      images: [{ url: '/img/unicorn.webp', alt: 'Unicorn Kit' }],
    },
  ];

  it('returns paginated products with defaults', async () => {
    prismaMock.product.findMany.mockResolvedValue(mockProducts as any);
    prismaMock.product.count.mockResolvedValue(1);

    const result = await ProductService.listProducts();

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublished: true },
        skip: 0,
        take: 20,
      })
    );
  });

  it('applies category filter', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await ProductService.listProducts({
      filters: { category: 'animals' },
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { slug: 'animals' },
        }),
      })
    );
  });

  it('applies price range filter', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await ProductService.listProducts({
      filters: { priceMin: 10, priceMax: 50 },
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: { gte: 10, lte: 50 },
        }),
      })
    );
  });

  it('applies text search on name and description', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await ProductService.listProducts({ search: 'unicorn' });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'unicorn', mode: 'insensitive' } },
            { description: { contains: 'unicorn', mode: 'insensitive' } },
          ],
        }),
      })
    );
  });

  it('ignores search with less than 2 characters', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await ProductService.listProducts({ search: 'a' });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublished: true },
      })
    );
  });

  it('sorts by price low to high', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await ProductService.listProducts({ sort: 'priceLow' });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: 'asc' },
      })
    );
  });

  it('calculates pagination correctly', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(45);

    const result = await ProductService.listProducts({ page: 2, limit: 20 });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    );
  });
});

// ─── getProductBySlug ──────────────────────────────────────────────────────────

describe('ProductService.getProductBySlug', () => {
  it('returns product detail when found', async () => {
    const mockProduct = {
      id: 'prod-1',
      slug: 'unicorn-kit',
      name: 'Unicorn Kit',
      description: 'A magical unicorn painting kit',
      price: { toNumber: () => 29.99 } as unknown as number,
      ageGroup: 'AGES_4_6',
      difficultyLevel: 'EASY',
      stock: 50,
      lowStockThreshold: 10,
      averageRating: { toNumber: () => 4.5 } as unknown as number,
      reviewCount: 12,
      isPublished: true,
      isFeatured: true,
      seoTitle: null,
      seoDescription: null,
      videoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: { id: 'cat-1', name: 'Animals', slug: 'animals' },
      images: [{ id: 'img-1', url: '/img/unicorn.webp', alt: 'Unicorn', order: 0 }],
    };

    prismaMock.product.findUnique.mockResolvedValue(mockProduct as any);

    const result = await ProductService.getProductBySlug('unicorn-kit');

    expect(result.slug).toBe('unicorn-kit');
    expect(result.name).toBe('Unicorn Kit');
    expect(result.images).toHaveLength(1);
  });

  it('throws not found when product does not exist', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    await expect(
      ProductService.getProductBySlug('nonexistent')
    ).rejects.toThrow('Product not found: nonexistent');
  });
});

// ─── getRelatedProducts ────────────────────────────────────────────────────────

describe('ProductService.getRelatedProducts', () => {
  it('returns products from same category excluding current', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    await ProductService.getRelatedProducts('prod-1', 'cat-1', 8);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'cat-1',
          id: { not: 'prod-1' },
          isPublished: true,
        },
        take: 8,
      })
    );
  });
});

// ─── updateStock ───────────────────────────────────────────────────────────────

describe('ProductService.updateStock', () => {
  it('updates stock and reports low stock status', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      lowStockThreshold: 10,
    } as any);
    prismaMock.product.update.mockResolvedValue({
      id: 'prod-1',
      name: 'Test Kit',
      stock: 5,
      lowStockThreshold: 10,
    } as any);

    const result = await ProductService.updateStock('prod-1', 5);

    expect(result.isLowStock).toBe(true);
    expect(result.isOutOfStock).toBe(false);
  });

  it('throws error for negative quantity', async () => {
    await expect(
      ProductService.updateStock('prod-1', -1)
    ).rejects.toThrow('Stock quantity cannot be negative');
  });

  it('throws not found for missing product', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    await expect(
      ProductService.updateStock('nonexistent', 10)
    ).rejects.toThrow('Product not found: nonexistent');
  });
});

// ─── deleteProduct ─────────────────────────────────────────────────────────────

describe('ProductService.deleteProduct', () => {
  it('deletes product when no pending orders', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Test Kit',
    } as any);
    prismaMock.orderItem.count.mockResolvedValue(0);
    prismaMock.product.delete.mockResolvedValue({} as any);

    const result = await ProductService.deleteProduct('prod-1');

    expect(result.success).toBe(true);
    expect(result.deletedId).toBe('prod-1');
  });

  it('throws conflict when product has pending orders', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Test Kit',
    } as any);
    prismaMock.orderItem.count.mockResolvedValue(3);

    await expect(
      ProductService.deleteProduct('prod-1')
    ).rejects.toThrow('Cannot delete product "Test Kit" with 3 pending order(s)');
  });
});
