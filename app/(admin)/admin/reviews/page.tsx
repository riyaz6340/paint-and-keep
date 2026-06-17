'use client';

/**
 * Paint & Keep - Admin Reviews Moderation Page
 *
 * Displays pending product reviews in a moderation queue.
 * Supports approve, reject, feature actions.
 * Paginated at 50 items per page, ordered oldest first.
 *
 * Requirements: 18.6, 18.7, 27.5
 */

import { useState, useEffect, useCallback } from 'react';

import ModerationQueue, {
  type ModerationItem,
  type ModerationAction,
} from '@/components/admin/ModerationQueue';

/* ─── Constants ────────────────────────────────────────────────────────── */

const ITEMS_PER_PAGE = 50;

/* ─── Page Component ───────────────────────────────────────────────────── */

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED' | 'all'>('PENDING');
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        orderBy: 'oldest',
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');

      const data = await res.json();
      setItems(
        data.items.map((item: Record<string, unknown>) => {
          const product = item.product as { name: string } | undefined;
          const user = item.user as { name: string; email: string } | undefined;
          const photos = item.photos as { url: string }[] | undefined;

          return {
            id: item.id as string,
            type: 'review' as const,
            imageUrl: photos?.[0]?.url || '/images/placeholder-review.png',
            title: `${user?.name || 'Anonymous'} — ★ ${item.rating}/5`,
            subtitle: product?.name || 'Unknown Product',
            description: item.text as string,
            metadata: {
              Rating: `${item.rating}/5`,
              Email: user?.email || 'N/A',
            },
            status: item.status as ModerationItem['status'],
            isFeatured: item.isFeatured as boolean,
            createdAt: item.createdAt as string,
          };
        })
      );
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAction = useCallback(
    async (action: ModerationAction) => {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Moderation action failed');
      }

      await fetchItems();
    },
    [fetchItems]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and moderate customer product reviews
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="reviews-status-filter" className="text-sm text-gray-600">
            Status:
          </label>
          <select
            id="reviews-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="FEATURED">Featured</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={fetchItems} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Moderation Queue */}
      <ModerationQueue
        items={items}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        onAction={handleAction}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
