'use client';

/**
 * Paint & Keep - Admin Gallery Moderation Page
 *
 * Displays pending gallery submissions in a moderation queue.
 * Supports approve, reject, feature actions with categorization (age group, theme, occasion tags).
 * Paginated at 50 items per page, ordered oldest first.
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */

import { useState, useEffect, useCallback } from 'react';

import ModerationQueue, {
  type ModerationItem,
  type ModerationAction,
} from '@/components/admin/ModerationQueue';

/* ─── Constants ────────────────────────────────────────────────────────── */

const ITEMS_PER_PAGE = 50;

const CATEGORY_OPTIONS = [
  {
    label: 'Age Group',
    options: ['Ages 4-6', 'Ages 7-9', 'Ages 10-12', 'Teens', 'Adults', 'Family'],
  },
  {
    label: 'Theme',
    options: ['Animals', 'Cartoon Characters', 'Fantasy', 'Festivals', 'Birthday Special', 'Nature', 'Abstract', 'Educational'],
  },
  {
    label: 'Occasion',
    options: ['Birthday', 'Holiday', 'School Project', 'Family Fun', 'Party', 'Gift'],
  },
];

/* ─── Page Component ───────────────────────────────────────────────────── */

export default function AdminGalleryPage() {
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

      const res = await fetch(`/api/admin/gallery?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch gallery items');

      const data = await res.json();
      setItems(
        data.items.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          type: 'gallery' as const,
          imageUrl: item.imageUrl as string,
          title: item.displayName as string,
          subtitle: `Kit: ${item.kitName}`,
          metadata: {
            Likes: item.likeCount as number,
          },
          status: item.status as ModerationItem['status'],
          isFeatured: item.isFeatured as boolean,
          createdAt: item.createdAt as string,
          tags: (item.tags as { tag: string }[] | undefined)?.map((t) => t.tag) || [],
        }))
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

      // Refresh the list after action
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
          <h1 className="text-2xl font-bold text-gray-900">Gallery Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and moderate customer artwork submissions
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="gallery-status-filter" className="text-sm text-gray-600">
            Status:
          </label>
          <select
            id="gallery-status-filter"
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
          <button
            onClick={fetchItems}
            className="ml-2 underline hover:no-underline"
          >
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
        showCategorization={true}
        categoryOptions={CATEGORY_OPTIONS}
      />
    </div>
  );
}
