'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  /** Initial quantity from cart (to persist state across navigation) */
  initialQuantity?: number;
}

/**
 * Individual product card with image, name, price, star rating, and Add To Cart button.
 * After adding, shows quantity controls (- count +) like Mamaearth.
 *
 * Requirements: 3.7
 */
export function ProductCard({ product, onAddToCart, onUpdateQuantity, initialQuantity = 0 }: ProductCardProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const imageUrl = product.images[0]?.url || '/placeholder-product.jpg';
  const imageAlt = product.images[0]?.alt || product.name;
  const isOutOfStock = product.stock === 0;

  const handleAdd = () => {
    if (!isOutOfStock) {
      onAddToCart(product.id);
      setQuantity(1);
    }
  };

  const handleIncrease = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const newQty = quantity + 1;
    setQuantity(newQty);
    if (onUpdateQuantity) {
      await onUpdateQuantity(product.id, newQty);
    } else {
      await onAddToCart(product.id);
    }
    setIsUpdating(false);
  };

  const handleDecrease = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const newQty = quantity - 1;
    setQuantity(newQty);
    if (onUpdateQuantity) {
      await onUpdateQuantity(product.id, newQty);
    }
    setIsUpdating(false);
  };

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
        <div className="mt-auto pt-2">
          <div className="mb-2">
            <span className="text-lg font-bold text-brand-dark">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>
          
          {quantity === 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              disabled={isOutOfStock}
              className="w-full rounded-lg bg-brand-primary py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={
                isOutOfStock
                  ? `${product.name} is out of stock`
                  : `Add ${product.name} to cart`
              }
            >
              {isOutOfStock ? 'Sold Out' : 'ADD TO CART'}
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-lg border-2 border-brand-primary overflow-hidden">
              <button
                onClick={(e) => { e.preventDefault(); handleDecrease(); }}
                className="flex items-center justify-center w-10 h-10 text-brand-primary font-bold text-lg hover:bg-brand-primary/10 transition-colors"
                aria-label="Decrease quantity"
              >
                –
              </button>
              <span className="text-sm font-bold text-brand-dark min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); handleIncrease(); }}
                className="flex items-center justify-center w-10 h-10 text-brand-primary font-bold text-lg hover:bg-brand-primary/10 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
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
