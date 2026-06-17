'use client';

/**
 * RelatedProducts - Displays 4-8 related products in a responsive grid.
 * Requirements: 4.5
 */

import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  images: { url: string; alt: string }[];
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

function StarRatingSmall({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-brand-highlight' : 'text-surface-tertiary'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-products-heading" className="mt-16">
      <h2 id="related-products-heading" className="text-display-sm text-brand-dark mb-6">
        Related Products
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.slice(0, 8).map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className="group card p-0 overflow-hidden transition-transform hover:-translate-y-1"
          >
            {/* Product image */}
            <div className="relative aspect-square bg-surface-tertiary overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-1 group-hover:text-brand-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                <StarRatingSmall rating={product.averageRating} />
                <span className="text-xs text-text-muted">({product.reviewCount})</span>
              </div>
              <p className="text-base font-bold text-brand-primary">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
