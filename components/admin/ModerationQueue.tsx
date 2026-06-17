'use client';

/**
 * Paint & Keep - Reusable Moderation Queue Component
 *
 * Provides approve/reject/feature buttons, image preview, and pagination
 * for moderating gallery photos, Instagram posts, reviews, and community stories.
 *
 * Requirements: 18.1-18.7, 8.5, 8.6, 9.4, 9.5
 */

import { useState, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface ModerationItem {
  id: string;
  type: 'gallery' | 'instagram' | 'review' | 'story';
  imageUrl: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, string | number>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
  isFeatured: boolean;
  createdAt: string;
  tags?: string[];
}

export interface ModerationAction {
  type: 'gallery' | 'instagram' | 'review' | 'story';
  id: string;
  action: 'approve' | 'reject' | 'feature';
  reason?: string;
  tags?: string[];
}

interface ModerationQueueProps {
  items: ModerationItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onAction: (action: ModerationAction) => Promise<void>;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showCategorization?: boolean;
  categoryOptions?: { label: string; options: string[] }[];
}

/* ─── Main Component ───────────────────────────────────────────────────── */

export default function ModerationQueue({
  items,
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onAction,
  onPageChange,
  isLoading = false,
  showCategorization = false,
  categoryOptions = [],
}: ModerationQueueProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [rejectReasonId, setRejectReasonId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});

  const handleAction = useCallback(
    async (item: ModerationItem, action: 'approve' | 'reject' | 'feature') => {
      if (processingIds.has(item.id)) return;

      if (action === 'reject' && !rejectReasonId) {
        setRejectReasonId(item.id);
        return;
      }

      setProcessingIds((prev) => new Set(prev).add(item.id));

      try {
        await onAction({
          type: item.type,
          id: item.id,
          action,
          reason: action === 'reject' ? rejectReason : undefined,
          tags: selectedTags[item.id],
        });
        setRejectReasonId(null);
        setRejectReason('');
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [processingIds, onAction, rejectReasonId, rejectReason, selectedTags]
  );

  const handleTagToggle = useCallback(
    (itemId: string, tag: string) => {
      setSelectedTags((prev) => {
        const current = prev[itemId] || [];
        const maxTags = 5;
        if (current.includes(tag)) {
          return { ...prev, [itemId]: current.filter((t) => t !== tag) };
        }
        if (current.length >= maxTags) return prev;
        return { ...prev, [itemId]: [...current, tag] };
      });
    },
    []
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
        <p className="text-sm text-gray-500 mt-1">No items pending moderation.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} pending items
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => (
          <ModerationCard
            key={item.id}
            item={item}
            isProcessing={processingIds.has(item.id)}
            showRejectInput={rejectReasonId === item.id}
            rejectReason={rejectReason}
            onRejectReasonChange={setRejectReason}
            onCancelReject={() => {
              setRejectReasonId(null);
              setRejectReason('');
            }}
            onAction={(action) => handleAction(item, action)}
            showCategorization={showCategorization}
            categoryOptions={categoryOptions}
            selectedTags={selectedTags[item.id] || []}
            onTagToggle={(tag) => handleTagToggle(item.id, tag)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

/* ─── Moderation Card ──────────────────────────────────────────────────── */

function ModerationCard({
  item,
  isProcessing,
  showRejectInput,
  rejectReason,
  onRejectReasonChange,
  onCancelReject,
  onAction,
  showCategorization,
  categoryOptions,
  selectedTags,
  onTagToggle,
}: {
  item: ModerationItem;
  isProcessing: boolean;
  showRejectInput: boolean;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  onCancelReject: () => void;
  onAction: (action: 'approve' | 'reject' | 'feature') => void;
  showCategorization: boolean;
  categoryOptions: { label: string; options: string[] }[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}) {
  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-opacity ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Image Preview */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {item.isFeatured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            ⭐ Featured
          </span>
        )}
        <span className="absolute top-2 right-2 bg-gray-900/70 text-white text-xs px-2 py-0.5 rounded-full capitalize">
          {item.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h3>
        {item.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
        )}
        {item.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-3">{item.description}</p>
        )}

        {/* Metadata */}
        {item.metadata && Object.keys(item.metadata).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(item.metadata).map(([key, value]) => (
              <span
                key={key}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        {/* Existing Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Categorization (Gallery only) */}
        {showCategorization && categoryOptions.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-700 mb-1">
              Categories ({selectedTags.length}/5):
            </p>
            {categoryOptions.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="text-xs text-gray-500 mb-1">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onTagToggle(opt)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        selectedTags.includes(opt)
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-purple-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400 mt-3">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* Reject reason input */}
        {showRejectInput && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <label className="text-xs font-medium text-gray-700">
              Rejection reason:
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => onAction('reject')}
                disabled={!rejectReason.trim()}
                className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={onCancelReject}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showRejectInput && (
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => onAction('approve')}
              disabled={isProcessing}
              className="flex-1 text-xs font-medium px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              aria-label={`Approve ${item.title}`}
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={() => onAction('reject')}
              disabled={isProcessing}
              className="flex-1 text-xs font-medium px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              aria-label={`Reject ${item.title}`}
            >
              ✕ Reject
            </button>
            <button
              type="button"
              onClick={() => onAction('feature')}
              disabled={isProcessing}
              className="flex-1 text-xs font-medium px-3 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
              aria-label={`Feature ${item.title}`}
            >
              ⭐ Feature
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Pagination ───────────────────────────────────────────────────────── */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              page === currentPage
                ? 'bg-purple-600 text-white border-purple-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
        >
          <div className="aspect-video bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 bg-gray-200 rounded-lg flex-1" />
              <div className="h-8 bg-gray-200 rounded-lg flex-1" />
              <div className="h-8 bg-gray-200 rounded-lg flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
