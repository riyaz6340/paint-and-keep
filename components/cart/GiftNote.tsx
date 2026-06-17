'use client';

/**
 * GiftNote - Gift note textarea with 250 character counter.
 * Requirements: 11.7
 */

import { useState, useCallback, useEffect } from 'react';

const MAX_CHARS = 250;

interface GiftNoteProps {
  value: string;
  onChange: (note: string) => void;
}

export default function GiftNote({ value, onChange }: GiftNoteProps) {
  const [note, setNote] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value changes
  useEffect(() => {
    setNote(value);
  }, [value]);

  const charsRemaining = MAX_CHARS - note.length;
  const isNearLimit = charsRemaining <= 30;
  const isAtLimit = charsRemaining <= 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.slice(0, MAX_CHARS);
      setNote(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <div>
      <label
        htmlFor="gift-note"
        className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-2"
      >
        <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
        Gift Note (optional)
      </label>
      <div className="relative">
        <textarea
          id="gift-note"
          value={note}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Add a personal message for the recipient..."
          maxLength={MAX_CHARS}
          rows={3}
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-brand-dark
                      placeholder:text-text-muted resize-none transition-colors
                      focus:outline-none
                      ${isFocused ? 'border-brand-primary' : 'border-surface-tertiary'}
                      ${isAtLimit ? 'border-status-warning' : ''}`}
          aria-describedby="gift-note-counter"
        />
      </div>
      {/* Character counter */}
      <div
        id="gift-note-counter"
        className={`mt-1.5 text-xs text-right transition-colors
                    ${isAtLimit ? 'text-status-error font-semibold' : isNearLimit ? 'text-status-warning' : 'text-text-muted'}`}
        aria-live="polite"
      >
        {note.length}/{MAX_CHARS} characters
      </div>
    </div>
  );
}
