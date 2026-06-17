'use client';

/**
 * AddToCartButton - Adds product to cart with a 5-second confirmation notification.
 * Requirements: 4.7
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  quantity: number;
  disabled?: boolean;
}

export default function AddToCartButton({
  productId,
  productName,
  quantity,
  disabled = false,
}: AddToCartButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = useCallback(async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    // TODO: integrate with cart context/API
    // Simulating cart add for now
    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsLoading(false);
    setShowConfirmation(true);

    // Hide confirmation after 5 seconds (Requirement 4.7)
    setTimeout(() => {
      setShowConfirmation(false);
    }, 5000);
  }, [disabled, isLoading]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isLoading}
        className="btn-primary w-full px-8 py-3 text-base"
        aria-label={`Add ${productName} to cart`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Add To Cart
          </span>
        )}
      </button>

      {/* Confirmation notification */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 -bottom-14 z-10 flex items-center gap-2 rounded-lg bg-status-success px-4 py-2 text-sm font-medium text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added to cart!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
