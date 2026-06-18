'use client';

import { ProductCard, type ProductCardData } from './ProductCard';

interface ProductGridProps {
  products: ProductCardData[];
  onAddToCart: (productId: string) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  cartItems?: Record<string, number>;
  isLoading?: boolean;
}

/**
 * Responsive grid of product cards.
 * Shows a loading skeleton grid when fetching, and products otherwise.
 *
 * Requirements: 3.7
 */
export function ProductGrid({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartItems = {},
  isLoading = false,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        aria-busy="true"
        aria-label="Loading products"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
      role="list"
      aria-label="Products"
    >
      {products.map((product) => (
        <div key={product.id} role="listitem">
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onUpdateQuantity={onUpdateQuantity}
            initialQuantity={cartItems[product.id] || 0}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-surface-tertiary rounded-t-2xl" />
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-3 bg-surface-tertiary rounded w-1/3" />
        <div className="h-4 bg-surface-tertiary rounded w-3/4" />
        <div className="h-3 bg-surface-tertiary rounded w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-surface-tertiary rounded w-16" />
          <div className="h-8 bg-surface-tertiary rounded w-20" />
        </div>
      </div>
    </div>
  );
}
