'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Debounced search input for product search.
 * Debounce: 500ms, minimum 2 characters before triggering search.
 *
 * Requirements: 3.3, 3.6
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search kits by name or keyword...',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        // Only trigger search if query is at least 2 chars or empty (to clear)
        if (newValue.length >= 2 || newValue.length === 0) {
          onChange(newValue);
        }
      }, 500);
    },
    [onChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={100}
        aria-label="Search products"
        className="w-full pl-10 pr-10 py-3 rounded-xl border border-surface-tertiary
                   bg-surface text-text-primary placeholder:text-text-muted
                   focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20
                   transition-all text-sm"
      />
      {/* Clear button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted
                     hover:text-text-primary transition-colors touch-target
                     flex items-center justify-center"
          aria-label="Clear search"
        >
          <svg
            className="w-4 h-4"
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
      )}
    </div>
  );
}
