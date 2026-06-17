'use client';

import { useCallback, useMemo, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Column<T> {
  /** Unique key for the column, corresponds to a field in the data */
  key: string;
  /** Display header label */
  header: string;
  /** Whether this column is sortable (default: false) */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (item: T) => React.ReactNode;
  /** CSS class applied to the column cells */
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  /** Unique key for the filter */
  key: string;
  /** Display label for the filter */
  label: string;
  /** Available options */
  options: FilterOption[];
  /** Placeholder text */
  placeholder?: string;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminDataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data to display */
  data: T[];
  /** Unique key extractor for each row */
  getRowKey: (item: T) => string;
  /** Filter configurations */
  filters?: FilterConfig[];
  /** Currently active filter values */
  activeFilters?: Record<string, string>;
  /** Callback when filters change */
  onFilterChange?: (filters: Record<string, string>) => void;
  /** Current sort state */
  sort?: SortState;
  /** Callback when sort changes */
  onSortChange?: (sort: SortState) => void;
  /** Pagination state */
  pagination?: PaginationState;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Search query */
  searchQuery?: string;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Whether data is loading */
  loading?: boolean;
  /** Action buttons for each row */
  actions?: (item: T) => React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable data table for admin dashboard modules.
 * Supports sorting, filtering, pagination, search, and row actions.
 *
 * Requirements: 15.1, 15.5, 15.7
 */
export function AdminDataTable<T>({
  columns,
  data,
  getRowKey,
  filters,
  activeFilters = {},
  onFilterChange,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  loading = false,
  actions,
  emptyMessage = 'No records found.',
}: AdminDataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSort = useCallback(
    (key: string) => {
      if (!onSortChange) return;

      let direction: SortDirection = 'asc';
      if (sort?.key === key) {
        if (sort.direction === 'asc') direction = 'desc';
        else if (sort.direction === 'desc') direction = null;
      }

      onSortChange({ key, direction });
    },
    [sort, onSortChange]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (!onFilterChange) return;
      const newFilters = { ...activeFilters, [key]: value };
      if (!value) delete newFilters[key];
      onFilterChange(newFilters);
    },
    [activeFilters, onFilterChange]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearchChange?.(localSearch);
    },
    [localSearch, onSearchChange]
  );

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;

  const getSortIcon = (key: string) => {
    if (sort?.key !== key || !sort.direction) {
      return (
        <svg className="ml-1 inline h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sort.direction === 'asc') {
      return (
        <svg className="ml-1 inline h-4 w-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg className="ml-1 inline h-4 w-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="w-full">
      {/* Toolbar: Search + Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        {onSearchChange && (
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Search"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        )}

        {/* Filters */}
        {filters && filters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <select
                key={filter.key}
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label={filter.label}
              >
                <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sort?.key === col.key && sort.direction
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && getSortIcon(col.key)}
                  </span>
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={getRowKey(item)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-gray-700 ${col.className || ''}`}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right text-sm">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous page"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    pageNum === pagination.page
                      ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-current={pageNum === pagination.page ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
