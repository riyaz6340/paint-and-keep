'use client';

/**
 * OutOfStockBadge - Displays an "Out of Stock" badge overlay.
 * Used on the product detail page when stock is 0.
 * Requirements: 4.9
 */

export default function OutOfStockBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-error/10 px-3 py-1.5 text-sm font-semibold text-status-error">
      <span className="h-2 w-2 rounded-full bg-status-error animate-pulse" aria-hidden="true" />
      Out of Stock
    </span>
  );
}
