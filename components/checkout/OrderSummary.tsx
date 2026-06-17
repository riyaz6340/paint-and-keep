'use client';

/**
 * OrderSummary - Checkout sidebar showing cart items, quantities, prices,
 * discount, shipping, and total.
 *
 * Requirements: 12.9
 */

import Image from 'next/image';

export interface OrderSummaryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  subtotal: number;
}

interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export default function OrderSummary({
  items,
  subtotal,
  discount,
  shipping,
  total,
}: OrderSummaryProps) {
  return (
    <div className="rounded-2xl border-2 border-surface-tertiary bg-surface-secondary p-5 sm:p-6 sticky top-6">
      <h2 className="font-heading text-lg font-semibold text-brand-dark mb-4">
        Order Summary
      </h2>

      {/* Items list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 items-start">
            {/* Product thumbnail */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-tertiary shrink-0">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-dark line-clamp-1">
                {item.name}
              </p>
              <p className="text-xs text-text-secondary">
                Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Item subtotal */}
            <span className="text-sm font-semibold text-brand-dark shrink-0">
              ₹{item.subtotal.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-surface-tertiary my-4" />

      {/* Price breakdown */}
      <div className="space-y-2.5 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-text-secondary">
            Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
          </span>
          <span className="font-medium text-brand-dark">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-status-success">
            <span>Discount</span>
            <span className="font-medium">
              − ₹{discount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between">
          <span className="text-text-secondary">Shipping</span>
          <span className="font-medium text-brand-dark">
            {shipping === 0 ? (
              <span className="text-status-success">Free</span>
            ) : (
              `₹${shipping.toLocaleString('en-IN')}`
            )}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-surface-tertiary mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-heading font-bold text-brand-dark text-base">Total</span>
          <span className="font-heading font-bold text-brand-dark text-xl">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-5 pt-4 border-t border-surface-tertiary">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <svg className="w-4 h-4 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>100% Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <svg className="w-4 h-4 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Easy returns within 7 days</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <svg className="w-4 h-4 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Free shipping on orders above ₹999</span>
          </div>
        </div>
      </div>
    </div>
  );
}
