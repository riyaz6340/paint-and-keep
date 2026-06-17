'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Categories matching Requirement 3.4
export const PRODUCT_CATEGORIES = [
  'Animals',
  'Cartoon Characters',
  'Fantasy',
  'Festivals',
  'Birthday Special',
  'Family Packs',
  'Educational Kits',
  'Seasonal Collections',
] as const;

export const AGE_GROUPS = [
  { value: 'TODDLER', label: '3-4 years' },
  { value: 'YOUNG_CHILD', label: '5-7 years' },
  { value: 'CHILD', label: '8-10 years' },
  { value: 'PRETEEN', label: '11-13 years' },
  { value: 'TEEN', label: '14+ years' },
  { value: 'ADULT', label: 'Adult' },
  { value: 'ALL_AGES', label: 'All Ages' },
] as const;

export const THEMES = [
  'Nature',
  'Space',
  'Underwater',
  'Dinosaurs',
  'Princesses',
  'Superheroes',
  'Sports',
  'Music',
] as const;

export const PRICE_RANGES = [
  { value: '0-500', label: 'Under ₹500', min: 0, max: 500 },
  { value: '500-1000', label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { value: '1000-2000', label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
  { value: '2000-5000', label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { value: '5000+', label: 'Above ₹5,000', min: 5000, max: undefined },
] as const;

export interface ShopFilters {
  category?: string;
  ageGroup?: string;
  theme?: string;
  priceRange?: string;
}

interface FilterSidebarProps {
  filters: ShopFilters;
  onFilterChange: (filters: ShopFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Filter sidebar/panel with Category, Age Group, Theme, and Price Range.
 * On mobile, slides in as an overlay. On desktop, displays as a sidebar.
 *
 * Requirements: 3.1
 */
export function FilterSidebar({
  filters,
  onFilterChange,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const updateFilter = (key: keyof ShopFilters, value: string | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const content = (
    <div className="space-y-6">
      {/* Category filter */}
      <FilterSection title="Category">
        <div className="space-y-2">
          {PRODUCT_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === cat}
                onChange={() =>
                  updateFilter(
                    'category',
                    filters.category === cat ? undefined : cat
                  )
                }
                className="w-4 h-4 text-brand-primary border-surface-tertiary
                           focus:ring-brand-primary/20"
              />
              <span className="text-sm text-text-primary group-hover:text-brand-primary transition-colors">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Age Group filter */}
      <FilterSection title="Age Group">
        <div className="space-y-2">
          {AGE_GROUPS.map((age) => (
            <label
              key={age.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="ageGroup"
                checked={filters.ageGroup === age.value}
                onChange={() =>
                  updateFilter(
                    'ageGroup',
                    filters.ageGroup === age.value ? undefined : age.value
                  )
                }
                className="w-4 h-4 text-brand-primary border-surface-tertiary
                           focus:ring-brand-primary/20"
              />
              <span className="text-sm text-text-primary group-hover:text-brand-primary transition-colors">
                {age.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Theme filter */}
      <FilterSection title="Theme">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() =>
                updateFilter(
                  'theme',
                  filters.theme === theme ? undefined : theme
                )
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.theme === theme
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-secondary text-text-primary hover:bg-brand-primary/10'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range filter */}
      <FilterSection title="Price Range">
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="priceRange"
                checked={filters.priceRange === range.value}
                onChange={() =>
                  updateFilter(
                    'priceRange',
                    filters.priceRange === range.value
                      ? undefined
                      : range.value
                  )
                }
                className="w-4 h-4 text-brand-primary border-surface-tertiary
                           focus:ring-brand-primary/20"
              />
              <span className="text-sm text-text-primary group-hover:text-brand-primary transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar (always visible on lg+) */}
      <aside
        className="hidden lg:block w-64 shrink-0"
        aria-label="Product filters"
      >
        <div className="sticky top-24 bg-surface rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-heading font-semibold text-brand-dark mb-4">
            Filters
          </h2>
          {content}
        </div>
      </aside>

      {/* Mobile filter overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              aria-hidden="true"
            />
            {/* Slide-in panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-surface z-50
                         lg:hidden overflow-y-auto shadow-card-hover"
              aria-label="Product filters"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-heading font-semibold text-brand-dark">
                    Filters
                  </h2>
                  <button
                    onClick={onClose}
                    className="touch-target flex items-center justify-center
                               text-text-secondary hover:text-brand-primary transition-colors"
                    aria-label="Close filters"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {content}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Helper: Collapsible Section ────────────────────────────────────────────

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-surface-tertiary pb-4 last:border-b-0 last:pb-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 touch-target"
        aria-expanded={isExpanded}
      >
        <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isExpanded && <div>{children}</div>}
    </div>
  );
}
