'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

/**
 * Displays active filters as removable chips with a clear-all control.
 *
 * Requirements: 3.9
 */
export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" role="region" aria-label="Active filters">
      <span className="text-sm text-text-secondary font-medium">
        Active filters:
      </span>
      <AnimatePresence>
        {filters.map((filter) => (
          <motion.button
            key={filter.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onRemoveFilter(filter.key)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                       bg-brand-primary/10 text-brand-primary text-sm font-medium
                       hover:bg-brand-primary/20 transition-colors touch-target"
            aria-label={`Remove filter: ${filter.label} ${filter.value}`}
          >
            <span>
              {filter.label}: {filter.value}
            </span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        ))}
      </AnimatePresence>
      <button
        onClick={onClearAll}
        className="text-sm text-text-secondary underline hover:text-brand-primary
                   transition-colors ml-2 touch-target"
        aria-label="Clear all filters"
      >
        Clear all
      </button>
    </div>
  );
}
