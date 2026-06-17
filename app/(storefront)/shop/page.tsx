import { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopContent } from '@/components/shop/ShopContent';
import { ProductService } from '@/lib/services/product-service';
import { SITE_CONFIG, PERFORMANCE } from '@/lib/constants';

/**
 * Shop page - Server Component with ISR (revalidate every 60 seconds).
 * Renders initial product listing server-side, then hydrates with
 * client-side filtering, sorting, search, and pagination.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */

export const revalidate = PERFORMANCE.isrRevalidate; // 60 seconds ISR

export const metadata: Metadata = {
  title: `Shop Creative Painting Kits | ${SITE_CONFIG.name}`,
  description:
    'Browse our collection of ready-to-paint creative kits for kids, families, and birthday parties. Filter by category, age group, theme, and price.',
  openGraph: {
    title: `Shop Creative Painting Kits | ${SITE_CONFIG.name}`,
    description:
      'Browse our collection of ready-to-paint creative kits for kids, families, and birthday parties.',
    url: `${SITE_CONFIG.url}/shop`,
  },
};

export default async function ShopPage() {
  // Fetch initial product data server-side (default: page 1, newest, no filters)
  let initialData;
  try {
    initialData = await ProductService.listProducts({
      page: 1,
      limit: 20,
      sort: 'newest',
    });
  } catch {
    // Fallback if DB/Redis unavailable during build
    initialData = {
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }

  return (
    <section className="container-page py-8 md:py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-display-md md:text-display-lg text-brand-dark mb-2">
          Shop
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Discover ready-to-paint creative kits for every occasion. Find the
          perfect kit for kids, birthdays, families, and more.
        </p>
      </div>

      {/* Shop content with filters, grid, and pagination */}
      <Suspense
        fallback={
          <div className="flex gap-8">
            {/* Skeleton sidebar */}
            <div className="hidden lg:block w-64 shrink-0">
              <div className="bg-surface rounded-2xl p-6 shadow-card animate-pulse">
                <div className="h-6 bg-surface-tertiary rounded w-20 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-surface-tertiary rounded w-full" />
                  ))}
                </div>
              </div>
            </div>
            {/* Skeleton grid */}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card p-0 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-surface-tertiary" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-surface-tertiary rounded w-1/3" />
                      <div className="h-4 bg-surface-tertiary rounded w-3/4" />
                      <div className="h-3 bg-surface-tertiary rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ShopContent initialData={initialData} />
      </Suspense>
    </section>
  );
}
