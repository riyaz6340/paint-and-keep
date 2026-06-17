'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ProductCard, type ProductCardData } from '@/components/shop/ProductCard';

/**
 * Best Sellers carousel section.
 * Fetches 4-12 products from the API; hides entirely if no published products exist.
 *
 * Requirements: 2.3, 2.4
 */

export default function BestSellers() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBestSellers() {
      try {
        const res = await fetch('/api/products?sort=popular&limit=12');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setProducts(data.products || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBestSellers();
  }, []);

  const handleAddToCart = async (productId: string) => {
    try {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    } catch {
      // Cart add failed silently — handled by cart context in production
    }
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Requirement 2.4: Hide section entirely if no published products
  if (!loading && products.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-16 sm:py-24" aria-label="Best Sellers loading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-surface-tertiary rounded-lg mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-surface-tertiary rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24" aria-labelledby="best-sellers-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="best-sellers-heading"
            className="font-heading text-display-sm sm:text-display-md text-brand-dark"
          >
            Best Sellers
          </h2>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-surface-tertiary hover:bg-brand-primary hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-surface-tertiary hover:bg-brand-primary hover:text-white transition-colors"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide
                     -mx-4 px-4 sm:mx-0 sm:px-0"
          role="region"
          aria-label="Best sellers product carousel"
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard product={product} onAddToCart={handleAddToCart} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
