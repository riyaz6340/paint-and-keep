'use client';

/**
 * QuantitySelector - Quantity input with +/- buttons (1-99 range).
 * Requirements: 4.6
 */

import { useState, useCallback } from 'react';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(String(value));

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max]
  );

  const handleDecrement = () => {
    const next = clamp(value - 1);
    setInputValue(String(next));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = clamp(value + 1);
    setInputValue(String(next));
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setInputValue(raw);
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    const clamped = isNaN(parsed) ? min : clamp(parsed);
    setInputValue(String(clamped));
    onChange(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="inline-flex items-center rounded-xl border-2 border-surface-tertiary overflow-hidden">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="touch-target flex items-center justify-center w-11 h-11 text-lg font-bold text-text-secondary hover:bg-surface-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-12 h-11 text-center text-base font-semibold text-text-primary bg-transparent border-x-2 border-surface-tertiary focus:outline-none disabled:opacity-40"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="touch-target flex items-center justify-center w-11 h-11 text-lg font-bold text-text-secondary hover:bg-surface-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
}
