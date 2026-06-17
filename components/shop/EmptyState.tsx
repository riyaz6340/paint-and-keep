'use client';

import { motion } from 'framer-motion';

interface EmptyStateProps {
  onClearFilters: () => void;
}

/**
 * Empty state shown when no products match the active filters/search.
 * Suggests clearing filters or modifying the search query.
 *
 * Requirements: 3.8
 */
export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {/* Decorative paint palette icon */}
      <div className="mb-6 text-6xl" aria-hidden="true">
        🎨
      </div>
      <h3 className="text-display-sm text-brand-dark mb-3">
        No products found
      </h3>
      <p className="text-text-secondary max-w-md mb-6">
        We couldn&apos;t find any products matching your current filters or
        search. Try clearing your filters or modifying your search query.
      </p>
      <button
        onClick={onClearFilters}
        className="btn-primary px-6 py-3"
        aria-label="Clear all filters"
      >
        Clear All Filters
      </button>
    </motion.div>
  );
}
