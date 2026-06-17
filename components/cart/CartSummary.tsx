'use client';

/**
 * CartSummary - Order summary sidebar showing subtotal, discount, shipping estimate, total,
 * and proceed to checkout button.
 * Requirements: 11.3, 11.5, 11.8
 */

import Link from 'next/link';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingEstimated: boolean;
  itemCount: number;
}

export default function CartSummary({
  subtotal,
  discount,
  shipping,
  total,
  shippingEstimated,
  itemCount,
}: CartSummaryProps) {
  return (
    <div className="rounded-2xl border-2 border-surface-tertiary bg-surface-secondary p-6 sticky top-6">
      <h2 className="font-heading text-lg font-semibold text-brand-dark mb-4">
        Order Summary
      </h2>

      <div className="space-y-3 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-text-secondary">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-semibold text-brand-dark">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-status-success">
            <span>Discount</span>
            <span className="font-semibold">
              − ₹{discount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between">
          <span className="text-text-secondary">
            Shipping
            {shippingEstimated && (
              <span className="text-xs text-text-muted ml-1">(estimated)</span>
            )}
          </span>
          <span className="font-semibold text-brand-dark">
            {shipping === 0 ? (
              <span className="text-status-success">Free</span>
            ) : (
              `₹${shipping.toLocaleString('en-IN')}`
            )}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-tertiary pt-3 mt-3">
          <div className="flex justify-between">
            <span className="font-bold text-brand-dark text-base">Total</span>
            <span className="font-bold text-brand-dark text-lg">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout button */}
      <Link
        href="/checkout"
        className="btn-primary w-full mt-6 py-3.5 text-center text-base inline-flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
        Proceed to Checkout
      </Link>

      {/* Trust signals */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Secure checkout · Free returns
      </div>
    </div>
  );
}
