'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductGrid } from './ProductGrid';
import { FilterSidebar, type ShopFilters, PRICE_RANGES, AGE_GROUPS } from './FilterSidebar';
import { SortDropdown, type SortOption } from './SortDropdown';
import { SearchInput } from './SearchInput';
import { ActiveFilters, type ActiveFilter } from './ActiveFilters';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import type { ProductCardData } from './ProductCard';

interface ProductListResult {
  products: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
}

interface ShopContentProps {
  initialData: ProductListResult;
}

/**
 * Client component that manages shop state: filters, sort, search, pagination.
 * Uses URL search params for shareable URLs.
 * Fetches updated product data client-side after initial SSR load.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */
export function ShopContent({ initialData }: ShopContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse initial state from URL params
  const [filters, setFilters] = useState<ShopFilters>(() => ({
    category: searchParams.get('category') || undefined,
    ageGroup: searchParams.get('ageGroup') || undefined,
    theme: searchParams.get('theme') || undefined,
    priceRange: searchParams.get('priceRange') || undefined,
  }));
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  );
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [data, setData] = useState<ProductListResult>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Build URL search params from current state
  const buildQueryString = useCallback(
    (
      f: ShopFilters,
      s: SortOption,
      q: string,
      p: number
    ): string => {
      const params = new URLSearchParams();
      if (f.category) params.set('category', f.category);
      if (f.ageGroup) params.set('ageGroup', f.ageGroup);
      if (f.theme) params.set('theme', f.theme);
      if (f.priceRange) params.set('priceRange', f.priceRange);
      if (s !== 'newest') params.set('sort', s);
      if (q) params.set('search', q);
      if (p > 1) params.set('page', String(p));
      return params.toString();
    },
    []
  );

  // Fetch products from API
  const fetchProducts = useCallback(
    async (
      f: ShopFilters,
      s: SortOption,
      q: string,
      p: number
    ) => {
      setIsLoading(true);

      try {
        const apiParams = new URLSearchParams();
        if (f.category) apiParams.set('category', f.category.toLowerCase().replace(/\s+/g, '-'));
        if (f.ageGroup) apiParams.set('ageGroup', f.ageGroup);
        if (f.theme) apiParams.set('theme', f.theme);
        if (f.priceRange) {
          const range = PRICE_RANGES.find((r) => r.value === f.priceRange);
          if (range) {
            apiParams.set('priceMin', String(range.min));
            if (range.max !== undefined) {
              apiParams.set('priceMax', String(range.max));
            }
          }
        }
        apiParams.set('sort', s);
        if (q && q.length >= 2) apiParams.set('search', q);
        apiParams.set('page', String(p));
        apiParams.set('limit', '20');

        const response = await fetch(`/api/products?${apiParams.toString()}`);
        if (response.ok) {
          const result: ProductListResult = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update URL and fetch when filters/sort/search/page change
  useEffect(() => {
    const queryString = buildQueryString(filters, sort, search, page);
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
    fetchProducts(filters, sort, search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, search, page]);

  // Handle filter changes (reset page to 1)
  const handleFilterChange = (newFilters: ShopFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle sort change (reset page to 1)
  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  };

  // Handle search change (reset page to 1)
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  // Build active filters list for display
  const activeFilters: ActiveFilter[] = [];
  if (filters.category) {
    activeFilters.push({
      key: 'category',
      label: 'Category',
      value: filters.category,
    });
  }
  if (filters.ageGroup) {
    const ageLabel =
      AGE_GROUPS.find((a) => a.value === filters.ageGroup)?.label ||
      filters.ageGroup;
    activeFilters.push({
      key: 'ageGroup',
      label: 'Age',
      value: ageLabel,
    });
  }
  if (filters.theme) {
    activeFilters.push({
      key: 'theme',
      label: 'Theme',
      value: filters.theme,
    });
  }
  if (filters.priceRange) {
    const priceLabel =
      PRICE_RANGES.find((r) => r.value === filters.priceRange)?.label ||
      filters.priceRange;
    activeFilters.push({
      key: 'priceRange',
      label: 'Price',
      value: priceLabel,
    });
  }
  if (search) {
    activeFilters.push({
      key: 'search',
      label: 'Search',
      value: search,
    });
  }

  // Remove a single filter
  const handleRemoveFilter = (key: string) => {
    if (key === 'search') {
      setSearch('');
    } else {
      setFilters((prev) => ({ ...prev, [key]: undefined }));
    }
    setPage(1);
  };

  // Clear all filters
  const handleClearAll = () => {
    setFilters({});
    setSearch('');
    setSort('newest');
    setPage(1);
  };

  // Add to cart handler - calls the cart API
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  // Fetch cart items to show quantities on product cards
  useEffect(() => {
    async function fetchCartItems() {
      try {
        const res = await fetch('/api/cart');
        if (res.ok) {
          const data = await res.json();
          const items: Record<string, number> = {};
          (data.items || []).forEach((item: { productId?: string; id?: string; quantity: number }) => {
            const pid = item.productId || item.id;
            if (pid) items[pid] = item.quantity;
          });
          setCartItems(items);
        }
      } catch {}
    }
    fetchCartItems();
  }, []);

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        setCartItems(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
        setCartMessage('Added to cart!');
        setTimeout(() => setCartMessage(null), 2000);
      } else {
        const data = await res.json();
        setCartMessage(data.message || 'Failed to add to cart');
        setTimeout(() => setCartMessage(null), 3000);
      }
    } catch {
      setCartMessage('Failed to add to cart');
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await fetch(`/api/cart/items/${productId}`, { method: 'DELETE' });
        setCartItems(prev => { const n = {...prev}; delete n[productId]; return n; });
      } else {
        await fetch(`/api/cart/items/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
        setCartItems(prev => ({ ...prev, [productId]: quantity }));
      }
    } catch {}
  };

  const showEmptyState = !isLoading && data.products.length === 0;

  return (
    <div className="flex gap-8">
      {/* Filter sidebar */}
      <FilterSidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {/* Top bar: search, sort, mobile filter toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Mobile filter button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden btn-outline px-4 py-3 text-sm"
            aria-label="Open filters"
          >
            <svg
              className="w-4 h-4 mr-2 inline-block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1.5 bg-brand-primary text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Search input */}
          <div className="flex-1">
            <SearchInput value={search} onChange={handleSearchChange} />
          </div>

          {/* Sort dropdown */}
          <SortDropdown value={sort} onChange={handleSortChange} />
        </div>

        {/* Active filters display */}
        <ActiveFilters
          filters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAll}
        />

        {/* Results count */}
        {!showEmptyState && (
          <p className="text-sm text-text-secondary mb-4">
            Showing{' '}
            <span className="font-semibold text-text-primary">
              {data.total}
            </span>{' '}
            {data.total === 1 ? 'product' : 'products'}
            {search && (
              <span>
                {' '}
                for &ldquo;<span className="font-medium">{search}</span>&rdquo;
              </span>
            )}
          </p>
        )}

        {/* Cart notification toast */}
        {cartMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-brand-dark text-white px-5 py-3 shadow-lg text-sm font-medium animate-fade-in-up">
            {cartMessage}
          </div>
        )}

        {/* Product grid or empty state */}
        {showEmptyState ? (
          <EmptyState onClearFilters={handleClearAll} />
        ) : (
          <ProductGrid
            products={data.products}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            cartItems={cartItems}
            isLoading={isLoading}
          />
        )}

        {/* Pagination */}
        {!showEmptyState && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
