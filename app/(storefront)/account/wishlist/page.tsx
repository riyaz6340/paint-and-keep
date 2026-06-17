'use client';

/**
 * Paint & Keep - Wishlist Page
 *
 * Displays saved products in a grid (up to 200 items).
 * Allows removing items and navigating to product pages.
 *
 * Requirements: 29.5
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/lib/hooks/useAuth';

interface WishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    stock: number;
    isPublished: boolean;
    images: { url: string; alt: string }[];
  };
}

interface Pagination {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function WishlistPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchWishlist = useCallback(async (page: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/account/wishlist?page=${page}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load wishlist');
      const data = await res.json();
      setItems(data.items);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist(currentPage);
    }
  }, [isAuthenticated, currentPage, fetchWishlist]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/account/wishlist?productId=${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to remove item');
      fetchWishlist(currentPage);
    } catch {
      setError('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (authLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-4xl">
        {/* Navigation */}
        <nav className="mb-8 flex flex-wrap gap-4 text-sm" aria-label="Account navigation">
          <Link href="/account" className="text-gray-600 hover:text-brand-dark">
            Profile
          </Link>
          <Link href="/account/addresses" className="text-gray-600 hover:text-brand-dark">
            Addresses
          </Link>
          <Link href="/account/orders" className="text-gray-600 hover:text-brand-dark">
            Orders
          </Link>
          <Link href="/account/wishlist" className="font-semibold text-brand-dark">
            Wishlist
          </Link>
          <Link href="/account/settings" className="text-gray-600 hover:text-brand-dark">
            Settings
          </Link>
        </nav>

        <h1 className="mb-2 text-display-sm text-brand-dark">My Wishlist</h1>
        {pagination && (
          <p className="mb-6 text-sm text-gray-500">{pagination.totalCount} items saved</p>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">Your wishlist is empty.</p>
            <Link
              href="/shop"
              className="mt-3 inline-block text-sm font-medium text-brand-primary hover:underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  {/* Product Image */}
                  <Link href={`/shop/${item.product.slug}`} className="block">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-3">
                    <Link href={`/shop/${item.product.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-brand-primary">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-brand-dark">
                      {formatCurrency(item.product.price)}
                    </p>

                    {/* Stock status */}
                    {item.product.stock === 0 && (
                      <p className="mt-1 text-xs text-red-600">Out of stock</p>
                    )}
                    {item.product.stock > 0 && item.product.stock <= 5 && (
                      <p className="mt-1 text-xs text-amber-600">Only {item.product.stock} left</p>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      disabled={removingId === item.product.id}
                      className="mt-2 text-xs text-red-600 hover:underline disabled:opacity-50"
                      aria-label={`Remove ${item.product.name} from wishlist`}
                    >
                      {removingId === item.product.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Wishlist pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
