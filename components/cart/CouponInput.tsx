'use client';

/**
 * CouponInput - Coupon code input with apply button and error/success feedback.
 * Max 30 alphanumeric characters.
 * Requirements: 11.4, 11.5, 11.6
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CouponInputProps {
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: () => Promise<void>;
}

export default function CouponInput({ appliedCoupon, onApply, onRemove }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, max 30
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30);
    setCode(value);
    // Clear errors when user types
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleApply = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await onApply(code.trim().toUpperCase());
      if (result.success) {
        setSuccessMessage('Coupon applied successfully!');
        setCode('');
      } else {
        setError(result.error || 'Invalid coupon code');
      }
    } catch {
      setError('Failed to apply coupon. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }, [code, onApply]);

  const handleRemoveCoupon = useCallback(async () => {
    await onRemove();
    setSuccessMessage(null);
  }, [onRemove]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  // If coupon is already applied, show the applied state
  if (appliedCoupon) {
    return (
      <div className="rounded-xl border-2 border-status-success/30 bg-status-success/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-brand-dark text-sm">
              {appliedCoupon.code}
            </span>
            <span className="text-sm text-status-success">
              − ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')} off
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-sm text-text-muted hover:text-status-error transition-colors"
            aria-label="Remove coupon"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="coupon-code"
        className="block text-sm font-semibold text-brand-dark mb-2"
      >
        Coupon Code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter coupon code"
          maxLength={30}
          disabled={isApplying}
          className="flex-1 rounded-xl border-2 border-surface-tertiary px-4 py-2.5 text-sm
                     font-medium text-brand-dark placeholder:text-text-muted
                     focus:outline-none focus:border-brand-primary transition-colors
                     disabled:opacity-50 uppercase"
          aria-describedby={error ? 'coupon-error' : undefined}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplying || !code.trim()}
          className="px-5 py-2.5 rounded-xl bg-brand-dark text-white text-sm font-semibold
                     hover:bg-brand-dark/90 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {/* Error/success feedback */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            id="coupon-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-status-error flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.p>
        )}
        {successMessage && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-status-success flex items-center gap-1"
            role="status"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
