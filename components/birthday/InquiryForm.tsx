'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { PackageTierData } from './PackageCard';

/* ─── Types ─── */

interface InquiryFormData {
  name: string;
  phone: string;
  email: string;
  partyDate: string;
  numberOfChildren: string;
  theme: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  partyDate?: string;
  numberOfChildren?: string;
  theme?: string;
  message?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

/* ─── Available themes ─── */

const AVAILABLE_THEMES = [
  'Animals',
  'Cartoon Characters',
  'Fantasy & Unicorns',
  'Superheroes',
  'Princess & Fairy',
  'Under the Sea',
  'Dinosaurs',
  'Space & Planets',
  'Rainbow & Colors',
  'Nature & Flowers',
];

/* ─── Validation ─── */

function getMinPartyDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

function validateInquiryForm(data: InquiryFormData): FieldErrors {
  const errors: FieldErrors = {};

  // Name: required, max 100 chars
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters';
  }

  // Phone: required, valid format
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      errors.phone = 'Phone must be in E.164 format (e.g., +919876543210)';
    }
  }

  // Email: required, valid format
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Party Date: required, at least 7 days in the future
  if (!data.partyDate) {
    errors.partyDate = 'Party date is required';
  } else {
    const selectedDate = new Date(data.partyDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);
    minDate.setHours(0, 0, 0, 0);
    if (selectedDate < minDate) {
      errors.partyDate = 'Party date must be at least 7 days from today';
    }
  }

  // Number of Children: required, 1-50
  if (!data.numberOfChildren) {
    errors.numberOfChildren = 'Number of children is required';
  } else {
    const num = parseInt(data.numberOfChildren, 10);
    if (isNaN(num) || num < 1) {
      errors.numberOfChildren = 'Number of children must be at least 1';
    } else if (num > 50) {
      errors.numberOfChildren = 'Number of children must not exceed 50';
    }
  }

  // Theme: required
  if (!data.theme) {
    errors.theme = 'Please select a theme';
  }

  // Message: optional, max 500 chars
  if (data.message && data.message.length > 500) {
    errors.message = 'Message must not exceed 500 characters';
  }

  return errors;
}

/* ─── Component ─── */

interface InquiryFormProps {
  selectedTier: PackageTierData | null;
}

export default function InquiryForm({ selectedTier }: InquiryFormProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    phone: '',
    email: '',
    partyDate: '',
    numberOfChildren: '',
    theme: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [serverError, setServerError] = useState('');

  // Pre-fill Number of Children when tier is selected (Requirement 5.7)
  useEffect(() => {
    if (selectedTier) {
      setFormData((prev) => ({
        ...prev,
        numberOfChildren: String(selectedTier.capacity),
      }));
      // Clear validation error for this field
      setErrors((prev) => ({ ...prev, numberOfChildren: undefined }));
    }
  }, [selectedTier]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Client-side validation
    const validationErrors = validateInquiryForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStatus('submitting');

    try {
      const response = await fetch('/api/birthday-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          partyDate: formData.partyDate,
          numberOfChildren: parseInt(formData.numberOfChildren, 10),
          packageTier: selectedTier?.id || 'STARTER_10',
          theme: formData.theme,
          message: formData.message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.details?.fields) {
          setErrors(data.details.fields);
          setStatus('idle');
          return;
        }
        throw new Error(data?.message || 'Failed to submit inquiry');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setServerError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-status-success/10 border border-status-success/30 rounded-2xl p-8 text-center"
        role="alert"
        aria-live="polite"
      >
        <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
        <h3 className="font-heading font-semibold text-xl text-text-primary mb-2">
          Inquiry Submitted Successfully!
        </h3>
        <p className="text-text-secondary">
          Thank you for your interest in our birthday packages! We&apos;ve sent a confirmation
          email to <strong>{formData.email}</strong>. Our team will reach out shortly to help
          plan the perfect party.
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            setFormData({
              name: '',
              phone: '',
              email: '',
              partyDate: '',
              numberOfChildren: selectedTier ? String(selectedTier.capacity) : '',
              theme: '',
              message: '',
            });
          }}
          className="mt-4 text-brand-primary font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          Submit another inquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
      aria-label="Birthday party inquiry form"
    >
      {/* Server error banner */}
      {status === 'error' && serverError && (
        <div
          className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 text-status-error text-sm"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium">{serverError}</p>
          <p className="mt-1 text-text-secondary text-xs">
            Your data has been preserved — please try again.
          </p>
        </div>
      )}

      {/* Selected package indicator */}
      {selectedTier && (
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 text-sm text-brand-dark">
          <span className="font-semibold">Selected Package:</span> {selectedTier.name} ({selectedTier.capacity} Kids)
        </div>
      )}

      {/* Row: Name + Phone */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Name field */}
        <div>
          <label
            htmlFor="inquiry-name"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Name <span className="text-status-error">*</span>
          </label>
          <input
            type="text"
            id="inquiry-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={100}
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'inquiry-name-error' : undefined}
            className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
              errors.name ? 'border-status-error' : 'border-surface-tertiary'
            }`}
            placeholder="Your full name"
          />
          {errors.name && (
            <p id="inquiry-name-error" className="mt-1.5 text-sm text-status-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Phone field */}
        <div>
          <label
            htmlFor="inquiry-phone"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Phone <span className="text-status-error">*</span>
          </label>
          <input
            type="tel"
            id="inquiry-phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'inquiry-phone-error' : undefined}
            className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
              errors.phone ? 'border-status-error' : 'border-surface-tertiary'
            }`}
            placeholder="+919876543210"
          />
          {errors.phone && (
            <p id="inquiry-phone-error" className="mt-1.5 text-sm text-status-error" role="alert">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="inquiry-email"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Email <span className="text-status-error">*</span>
        </label>
        <input
          type="email"
          id="inquiry-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'inquiry-email-error' : undefined}
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
            errors.email ? 'border-status-error' : 'border-surface-tertiary'
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="inquiry-email-error" className="mt-1.5 text-sm text-status-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Row: Party Date + Number of Children */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Party Date field */}
        <div>
          <label
            htmlFor="inquiry-partyDate"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Party Date <span className="text-status-error">*</span>
          </label>
          <input
            type="date"
            id="inquiry-partyDate"
            name="partyDate"
            value={formData.partyDate}
            onChange={handleChange}
            min={getMinPartyDate()}
            required
            aria-invalid={!!errors.partyDate}
            aria-describedby={errors.partyDate ? 'inquiry-partyDate-error' : 'inquiry-partyDate-hint'}
            className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
              errors.partyDate ? 'border-status-error' : 'border-surface-tertiary'
            }`}
          />
          {errors.partyDate ? (
            <p id="inquiry-partyDate-error" className="mt-1.5 text-sm text-status-error" role="alert">
              {errors.partyDate}
            </p>
          ) : (
            <p id="inquiry-partyDate-hint" className="mt-1.5 text-xs text-text-muted">
              At least 7 days from today
            </p>
          )}
        </div>

        {/* Number of Children field */}
        <div>
          <label
            htmlFor="inquiry-numberOfChildren"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Number of Children <span className="text-status-error">*</span>
          </label>
          <input
            type="number"
            id="inquiry-numberOfChildren"
            name="numberOfChildren"
            value={formData.numberOfChildren}
            onChange={handleChange}
            min={1}
            max={50}
            required
            aria-invalid={!!errors.numberOfChildren}
            aria-describedby={errors.numberOfChildren ? 'inquiry-numberOfChildren-error' : 'inquiry-numberOfChildren-hint'}
            className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
              errors.numberOfChildren ? 'border-status-error' : 'border-surface-tertiary'
            }`}
            placeholder="e.g. 10"
          />
          {errors.numberOfChildren ? (
            <p id="inquiry-numberOfChildren-error" className="mt-1.5 text-sm text-status-error" role="alert">
              {errors.numberOfChildren}
            </p>
          ) : (
            <p id="inquiry-numberOfChildren-hint" className="mt-1.5 text-xs text-text-muted">
              Between 1 and 50
            </p>
          )}
        </div>
      </div>

      {/* Theme field */}
      <div>
        <label
          htmlFor="inquiry-theme"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Theme <span className="text-status-error">*</span>
        </label>
        <select
          id="inquiry-theme"
          name="theme"
          value={formData.theme}
          onChange={handleChange}
          required
          aria-invalid={!!errors.theme}
          aria-describedby={errors.theme ? 'inquiry-theme-error' : undefined}
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
            errors.theme ? 'border-status-error' : 'border-surface-tertiary'
          } ${!formData.theme ? 'text-text-muted' : ''}`}
        >
          <option value="">Select a theme</option>
          {AVAILABLE_THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
        {errors.theme && (
          <p id="inquiry-theme-error" className="mt-1.5 text-sm text-status-error" role="alert">
            {errors.theme}
          </p>
        )}
      </div>

      {/* Message field */}
      <div>
        <label
          htmlFor="inquiry-message"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Message <span className="text-text-muted text-xs">(optional)</span>
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          maxLength={500}
          rows={4}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'inquiry-message-error' : 'inquiry-message-hint'}
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors resize-y ${
            errors.message ? 'border-status-error' : 'border-surface-tertiary'
          }`}
          placeholder="Any special requests, dietary restrictions, or other details..."
        />
        <div className="flex justify-between mt-1.5">
          {errors.message ? (
            <p id="inquiry-message-error" className="text-sm text-status-error" role="alert">
              {errors.message}
            </p>
          ) : (
            <p id="inquiry-message-hint" className="text-xs text-text-muted">
              Max 500 characters
            </p>
          )}
          <span className="text-xs text-text-muted" aria-hidden="true">
            {formData.message.length}/500
          </span>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-xl bg-brand-primary text-text-inverse font-heading font-semibold py-3.5 px-6 shadow-button hover:shadow-button-hover hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {status === 'submitting' ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          'Submit Birthday Inquiry'
        )}
      </button>
    </form>
  );
}
