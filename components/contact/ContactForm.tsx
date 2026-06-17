'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

function validateContactForm(data: ContactFormData): FieldErrors {
  const errors: FieldErrors = {};

  // Name validation: required, max 100 chars
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters';
  }

  // Email validation: required, max 254 chars, valid format
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (data.email.trim().length > 254) {
    errors.email = 'Email must not exceed 254 characters';
  } else {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Subject validation: required, max 200 chars
  if (!data.subject.trim()) {
    errors.subject = 'Subject is required';
  } else if (data.subject.trim().length > 200) {
    errors.subject = 'Subject must not exceed 200 characters';
  }

  // Message validation: required, min 10, max 2000 chars
  if (!data.message.trim()) {
    errors.message = 'Message is required';
  } else if (data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (data.message.trim().length > 2000) {
    errors.message = 'Message must not exceed 2000 characters';
  }

  return errors;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [serverError, setServerError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    const validationErrors = validateContactForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.details?.fields) {
          setErrors(data.details.fields);
          setStatus('idle');
          return;
        }
        throw new Error(data?.message || 'Failed to submit the form');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
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
        <div className="text-4xl mb-3" aria-hidden="true">✅</div>
        <h3 className="font-heading font-semibold text-xl text-text-primary mb-2">
          Message Sent Successfully!
        </h3>
        <p className="text-text-secondary">
          Thank you for reaching out. Our team will get back to you shortly.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-brand-primary font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
      aria-label="Contact form"
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

      {/* Name field */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Name <span className="text-status-error">*</span>
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          maxLength={100}
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
            errors.name ? 'border-status-error' : 'border-surface-tertiary'
          }`}
          placeholder="Your full name"
        />
        {errors.name && (
          <p
            id="contact-name-error"
            className="mt-1.5 text-sm text-status-error"
            role="alert"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Email <span className="text-status-error">*</span>
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          maxLength={254}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
            errors.email ? 'border-status-error' : 'border-surface-tertiary'
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p
            id="contact-email-error"
            className="mt-1.5 text-sm text-status-error"
            role="alert"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Subject field */}
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Subject <span className="text-status-error">*</span>
        </label>
        <input
          type="text"
          id="contact-subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          maxLength={200}
          required
          aria-invalid={!!errors.subject}
          aria-describedby={
            errors.subject ? 'contact-subject-error' : undefined
          }
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
            errors.subject ? 'border-status-error' : 'border-surface-tertiary'
          }`}
          placeholder="What is this about?"
        />
        {errors.subject && (
          <p
            id="contact-subject-error"
            className="mt-1.5 text-sm text-status-error"
            role="alert"
          >
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message field */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Message <span className="text-status-error">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          maxLength={2000}
          rows={5}
          required
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? 'contact-message-error' : 'contact-message-hint'
          }
          className={`w-full rounded-xl border px-4 py-3 text-text-primary bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors resize-y ${
            errors.message ? 'border-status-error' : 'border-surface-tertiary'
          }`}
          placeholder="Tell us how we can help (min 10 characters)..."
        />
        <div className="flex justify-between mt-1.5">
          {errors.message ? (
            <p
              id="contact-message-error"
              className="text-sm text-status-error"
              role="alert"
            >
              {errors.message}
            </p>
          ) : (
            <p
              id="contact-message-hint"
              className="text-xs text-text-muted"
            >
              Min 10, max 2000 characters
            </p>
          )}
          <span className="text-xs text-text-muted" aria-hidden="true">
            {formData.message.length}/2000
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
            Sending...
          </span>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
