'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  stock: number;
  images: { url: string; alt: string }[];
  category: { name: string; slug: string };
}

interface ProductCardProps {
  product: ProductCardData;
  onAddToCart: (productId: string) => void;
}

/**
 * Individual product card with image, name, price, star rating, and Add To Cart button.
 *
 * Requirements: 3.7
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUrl = product.images[0]?.url || '/placeholder-product.jpg';
  const imageAlt = product.images[0]?.alt || product.name;
  const isOutOfStock = product.stock === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group flex flex-col h-full overflow-hidden p-0"
    >
      {/* Product image */}
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-t-2xl"
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300
                     group-hover:scale-105"
        />
        {isOutOfStock && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            aria-label="Out of stock"
          >
            <span className="bg-white text-text-primary px-3 py-1 rounded-full text-sm font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product details */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category */}
        <span className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1">
          {product.category.name}
        </span>

        {/* Name */}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="text-sm font-semibold text-brand-dark line-clamp-2 mb-2
                         group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.averageRating} />
          <span className="text-xs text-text-muted ml-1">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price and Add to Cart */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold text-brand-dark">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isOutOfStock) {
                onAddToCart(product.id);
              }
            }}
            disabled={isOutOfStock}
            className="btn-primary text-xs px-3 py-2 disabled:opacity-50
                       disabled:cursor-not-allowed"
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
          >
            {isOutOfStock ? 'Sold Out' : 'Add To Cart'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Star Rating Component ──────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div
      className="flex items-center"
      role="img"
      aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}
    >
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg
          key={`full-${i}`}
          className="w-4 h-4 text-brand-highlight fill-current"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {/* Half star */}
      {hasHalf && (
        <svg
          className="w-4 h-4 text-brand-highlight"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="half-star-grad">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-star-grad)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-200 fill-current"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
