'use client';

/**
 * ShippingEstimate - Shipping cost estimate display that updates on address entry within 3 seconds.
 * Requirements: 11.8
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface ShippingEstimateProps {
  onEstimate: (postalCode: string) => Promise<{ cost: number; message: string } | null>;
  currentEstimate: number;
}

export default function ShippingEstimate({ onEstimate, currentEstimate }: ShippingEstimateProps) {
  const [postalCode, setPostalCode] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce postal code input for estimation
  useEffect(() => {
    if (postalCode.length >= 5) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        handleEstimate();
      }, 1000);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  const handleEstimate = useCallback(async () => {
    if (!postalCode.trim() || postalCode.length < 5) {
      return;
    }

    setIsEstimating(true);
    setError(null);

    try {
      const result = await onEstimate(postalCode.trim());
      if (result) {
        setEstimateMessage(result.message);
      } else {
        setError('Unable to estimate shipping for this location');
      }
    } catch {
      setError('Failed to get shipping estimate');
    } finally {
      setIsEstimating(false);
    }
  }, [postalCode, onEstimate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setPostalCode(value);
    setError(null);
    setEstimateMessage(null);
  };

  return (
    <div>
      <label
        htmlFor="shipping-postal"
        className="block text-sm font-semibold text-brand-dark mb-2"
      >
        Estimate Shipping
      </label>
      <div className="flex gap-2">
        <input
          id="shipping-postal"
          type="text"
          inputMode="numeric"
          value={postalCode}
          onChange={handleInputChange}
          placeholder="Enter PIN code"
          maxLength={6}
          className="flex-1 rounded-xl border-2 border-surface-tertiary px-4 py-2.5 text-sm
                     font-medium text-brand-dark placeholder:text-text-muted
                     focus:outline-none focus:border-brand-primary transition-colors"
          aria-describedby="shipping-feedback"
        />
        <button
          type="button"
          onClick={handleEstimate}
          disabled={isEstimating || postalCode.length < 5}
          className="px-4 py-2.5 rounded-xl bg-surface-tertiary text-brand-dark text-sm font-semibold
                     hover:bg-brand-primary hover:text-white transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEstimating ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            'Check'
          )}
        </button>
      </div>

      {/* Feedback */}
      <div id="shipping-feedback" className="mt-2">
        {isEstimating && (
          <p className="text-xs text-text-muted flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Estimating shipping...
          </p>
        )}
        {estimateMessage && !isEstimating && (
          <p className="text-xs text-status-success flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {estimateMessage}
          </p>
        )}
        {error && !isEstimating && (
          <p className="text-xs text-status-error flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {currentEstimate > 0 && !isEstimating && !estimateMessage && !error && (
          <p className="text-xs text-text-muted">
            Current estimate: ₹{currentEstimate.toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}
