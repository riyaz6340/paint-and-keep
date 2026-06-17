'use client';

/**
 * ProductDetailClient - Client component orchestrating all product detail sub-components.
 * Handles interactivity: quantity state, out-of-stock, video display.
 *
 * Requirements: 4.1-4.9
 */

import { useState } from 'react';
import Link from 'next/link';
import ImageGallery from '@/components/product/ImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import QuantitySelector from '@/components/product/QuantitySelector';
import AddToCartButton from '@/components/product/AddToCartButton';
import BuyNowButton from '@/components/product/BuyNowButton';
import OutOfStockBadge from '@/components/product/OutOfStockBadge';
import ReviewSection from '@/components/product/ReviewSection';
import RelatedProducts from '@/components/product/RelatedProducts';
import type { ReviewData } from '@/components/product/ReviewCard';

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductData {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  ageGroup: string;
  difficultyLevel: string;
  stock: number;
  averageRating: number;
  reviewCount: number;
  videoUrl: string | null;
  category: ProductCategory;
  images: ProductImage[];
}

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  images: { url: string; alt: string }[];
}

interface ProductDetailClientProps {
  product: ProductData;
  relatedProducts: RelatedProduct[];
  initialReviews: ReviewData[];
  reviewsTotal: number;
  reviewsTotalPages: number;
}

export default function ProductDetailClient({
  product,
  relatedProducts,
  initialReviews,
  reviewsTotal,
  reviewsTotalPages,
}: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = product.stock === 0;

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-text-muted">
          <li>
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="hover:text-brand-primary transition-colors">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-brand-primary transition-colors"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-text-primary font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main product section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image gallery */}
        <div>
          <ImageGallery
            images={product.images}
            productName={product.name}
            videoUrl={product.videoUrl}
          />
        </div>

        {/* Right: Product info + actions */}
        <div className="flex flex-col">
          {/* Out of stock badge */}
          {isOutOfStock && (
            <div className="mb-4">
              <OutOfStockBadge />
            </div>
          )}

          {/* Product info */}
          <ProductInfo
            name={product.name}
            price={product.price}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            description={product.description}
            ageGroup={product.ageGroup}
            difficultyLevel={product.difficultyLevel}
            category={product.category}
          />

          {/* Purchase actions */}
          <div className="mt-8 pt-6 border-t border-surface-tertiary space-y-4">
            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-text-primary">Quantity:</label>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={99}
                disabled={isOutOfStock}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  quantity={quantity}
                  disabled={isOutOfStock}
                />
              </div>
              <div className="flex-1">
                <BuyNowButton
                  productId={product.id}
                  productSlug={product.slug}
                  quantity={quantity}
                  disabled={isOutOfStock}
                />
              </div>
            </div>

            {/* Out of stock message */}
            {isOutOfStock && (
              <p className="text-sm text-status-error font-medium text-center">
                This product is currently out of stock. Please check back later.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Product video */}
      {product.videoUrl && (
        <section id="product-video" className="mt-12" aria-labelledby="video-heading">
          <h2 id="video-heading" className="text-display-sm text-brand-dark mb-4">
            Product Video
          </h2>
          <div className="rounded-2xl overflow-hidden bg-brand-dark aspect-video max-w-3xl">
            <video
              src={product.videoUrl}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
              aria-label={`${product.name} product video`}
            >
              <p>
                Your browser does not support the video element.{' '}
                <a href={product.videoUrl} className="text-brand-primary underline">
                  Download the video
                </a>
              </p>
            </video>
          </div>
        </section>
      )}

      {/* Customer reviews */}
      <ReviewSection
        productId={product.id}
        initialReviews={initialReviews}
        totalReviews={reviewsTotal}
        initialPage={1}
        totalPages={reviewsTotalPages}
        averageRating={product.averageRating}
      />

      {/* Related products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
