'use client';

/**
 * BuyNowButton - Redirects to checkout with selected product and quantity.
 * Requirements: 4.8
 */

import { useCallback } from 'react';

interface BuyNowButtonProps {
  productId: string;
  productSlug: string;
  quantity: number;
  disabled?: boolean;
}

export default function BuyNowButton({
  productId,
  productSlug,
  quantity,
  disabled = false,
}: BuyNowButtonProps) {
  const handleBuyNow = useCallback(() => {
    if (disabled) return;

    // Navigate to checkout with product info
    const params = new URLSearchParams({
      product: productId,
      slug: productSlug,
      qty: String(quantity),
    });

    window.location.href = `/checkout?${params.toString()}`;
  }, [disabled, productId, productSlug, quantity]);

  return (
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={disabled}
      className="btn-secondary w-full px-8 py-3 text-base"
      aria-label="Buy now - proceed to checkout"
    >
      <span className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Buy Now
      </span>
    </button>
  );
}
