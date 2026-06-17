/**
 * Paint & Keep - Product Detail Page (SSR)
 *
 * Displays full product information with:
 * - SEO metadata (generateMetadata)
 * - JSON-LD structured data (Product schema)
 * - Image gallery with zoom (3x) and 360-degree view
 * - Product video (when available)
 * - Description, what's included, age, difficulty
 * - Quantity selector, Add To Cart, Buy Now
 * - Customer reviews (paginated, 10/page)
 * - Related products (4-8 items)
 * - Out-of-stock handling
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductService } from '@/lib/services/product-service';
import ProductDetailClient from './ProductDetailClient';

interface ProductDetailPageProps {
  params: { slug: string };
}

// ─── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  try {
    const product = await ProductService.getProductBySlug(params.slug);

    const title = product.seoTitle || `${product.name} | Paint & Keep`;
    const description =
      product.seoDescription ||
      product.description.slice(0, 160).replace(/\n/g, ' ');

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: product.images[0]
          ? [{ url: product.images[0].url, alt: product.images[0].alt }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return {
      title: 'Product Not Found | Paint & Keep',
    };
  }
}

// ─── Page Component (Server) ───────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product;
  try {
    product = await ProductService.getProductBySlug(params.slug);
  } catch {
    notFound();
  }

  const [relatedProducts, reviewsData] = await Promise.all([
    ProductService.getRelatedProducts(product.id, product.category.id, 8),
    ProductService.getProductReviews(product.id, 1, 10),
  ]);

  // JSON-LD Structured Data (Product schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description.slice(0, 5000),
    image: product.images.map((img) => img.url),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Paint & Keep',
    },
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      url: `https://paintandkeep.com/shop/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Paint & Keep',
      },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ProductDetailClient
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: product.price,
          ageGroup: product.ageGroup,
          difficultyLevel: product.difficultyLevel,
          stock: product.stock,
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
          videoUrl: product.videoUrl,
          category: product.category,
          images: product.images,
        }}
        relatedProducts={relatedProducts}
        initialReviews={reviewsData.reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        }))}
        reviewsTotal={reviewsData.total}
        reviewsTotalPages={reviewsData.totalPages}
      />
    </>
  );
}
