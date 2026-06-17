'use client';

/**
 * GalleryFilters - Filter panel for the gallery page.
 *
 * Provides single-select combinable filters for Age Group, Theme,
 * Occasion, Date, and Location. Filters are combinable to narrow results.
 *
 * Requirements: 7.2
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GalleryFilterState {
  ageGroup: string;
  theme: string;
  occasion: string;
  date: string;
  location: string;
}

interface GalleryFiltersProps {
  filters: GalleryFilterState;
  onFilterChange: (filters: GalleryFilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AGE_GROUPS = ['4-6', '7-9', '10-12', 'Teens', 'Adults', 'Family'];
const THEMES = ['Animals', 'Fantasy', 'Nature', 'Cartoons', 'Festivals', 'Abstract'];
const OCCASIONS = ['Birthday', 'School Activity', 'Family Fun', 'Holiday', 'Workshop'];
const LOCATIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

export default function GalleryFilters({
  filters,
  onFilterChange,
  isOpen,
  onToggle,
}: GalleryFiltersProps) {
  const updateFilter = useCallback(
    (key: keyof GalleryFilterState, value: string) => {
      onFilterChange({
        ...filters,
        [key]: filters[key] === value ? '' : value,
      });
    },
    [filters, onFilterChange]
  );

  const clearAllFilters = useCallback(() => {
    onFilterChange({ ageGroup: '', theme: '', occasion: '', date: '', location: '' });
  }, [onFilterChange]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Filter toggle button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onToggle}
          className="btn-outline px-4 py-2 text-sm flex items-center gap-2"
          aria-expanded={isOpen}
          aria-controls="gallery-filters-panel"
        >
          <FilterIcon />
          Filters
          {activeCount > 0 && (
            <span className="bg-brand-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter pills */}
        {activeCount > 0 && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {filters.ageGroup && (
                <FilterPill
                  label={`Age: ${filters.ageGroup}`}
                  onRemove={() => updateFilter('ageGroup', filters.ageGroup)}
                />
              )}
              {filters.theme && (
                <FilterPill
                  label={`Theme: ${filters.theme}`}
                  onRemove={() => updateFilter('theme', filters.theme)}
                />
              )}
              {filters.occasion && (
                <FilterPill
                  label={`Occasion: ${filters.occasion}`}
                  onRemove={() => updateFilter('occasion', filters.occasion)}
                />
              )}
              {filters.date && (
                <FilterPill
                  label={`From: ${filters.date}`}
                  onRemove={() => updateFilter('date', filters.date)}
                />
              )}
              {filters.location && (
                <FilterPill
                  label={`Location: ${filters.location}`}
                  onRemove={() => updateFilter('location', filters.location)}
                />
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-brand-primary hover:text-orange-600 font-medium transition-colors"
            >
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="gallery-filters-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 bg-surface rounded-2xl shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Age Group */}
              <FilterGroup
                label="Age Group"
                options={AGE_GROUPS}
                selected={filters.ageGroup}
                onSelect={(value) => updateFilter('ageGroup', value)}
              />

              {/* Theme */}
              <FilterGroup
                label="Theme"
                options={THEMES}
                selected={filters.theme}
                onSelect={(value) => updateFilter('theme', value)}
              />

              {/* Occasion */}
              <FilterGroup
                label="Occasion"
                options={OCCASIONS}
                selected={filters.occasion}
                onSelect={(value) => updateFilter('occasion', value)}
              />

              {/* Date */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Date From
                </p>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    onFilterChange({ ...filters, date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-secondary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                  aria-label="Filter by date from"
                />
              </div>

              {/* Location */}
              <FilterGroup
                label="Location"
                options={LOCATIONS}
                selected={filters.location}
                onSelect={(value) => updateFilter('location', value)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

function FilterGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
              selected === option
                ? 'bg-brand-primary text-white'
                : 'bg-surface-tertiary text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
            }`}
            aria-pressed={selected === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove filter: ${label}`}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

/* ─── Icons ────────────────────────────────────────────────────────────── */

function FilterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}
