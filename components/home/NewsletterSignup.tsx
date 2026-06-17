'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

/**
 * Newsletter signup section with name (max 100 chars) and email validation.
 * Displays success/error messages on submission.
 *
 * Requirements: 2.9, 2.10, 2.11
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
}

export default function NewsletterSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Subscription failed. Please try again.');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setErrors({});
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent" aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="newsletter-heading"
            className="font-heading text-display-sm sm:text-display-md text-white"
          >
            Stay Creative!
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Get exclusive offers, new kit launches, and creative inspiration delivered to your inbox.
          </p>

          {/* Success state */}
          {status === 'success' ? (
            <motion.div
              className="mt-8 bg-white/20 backdrop-blur-sm rounded-2xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-3 text-white">
                <svg className="w-8 h-8 text-brand-highlight" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg font-semibold">Welcome aboard! 🎨</span>
              </div>
              <p className="mt-2 text-white/80">
                You&apos;ve successfully subscribed. Check your inbox for a creative surprise!
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
              noValidate
              aria-label="Newsletter signup form"
            >
              {/* Error banner */}
              {status === 'error' && errorMessage && (
                <motion.div
                  className="bg-status-error/20 border border-status-error/30 text-white rounded-xl p-3 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  aria-live="polite"
                >
                  {errorMessage}
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Name field */}
                <div className="flex-1">
                  <label htmlFor="newsletter-name" className="sr-only">
                    Name
                  </label>
                  <input
                    id="newsletter-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    maxLength={100}
                    placeholder="Your name"
                    className={`w-full rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/60
                               bg-white/90 backdrop-blur-sm border-2 transition-colors
                               focus:outline-none focus:ring-2 focus:ring-brand-highlight
                               ${errors.name ? 'border-status-error' : 'border-transparent'}`}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'newsletter-name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="newsletter-name-error" className="mt-1 text-sm text-brand-highlight text-left" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email field */}
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="Your email"
                    className={`w-full rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/60
                               bg-white/90 backdrop-blur-sm border-2 transition-colors
                               focus:outline-none focus:ring-2 focus:ring-brand-highlight
                               ${errors.email ? 'border-status-error' : 'border-transparent'}`}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="newsletter-email-error" className="mt-1 text-sm text-brand-highlight text-left" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="rounded-xl px-6 py-3 bg-brand-highlight text-brand-dark font-semibold
                             hover:bg-brand-highlight/90 transition-colors shadow-button
                             disabled:opacity-70 disabled:cursor-not-allowed
                             whitespace-nowrap"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Subscribing...
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>

              <p className="text-xs text-white/60">
                No spam, ever. Unsubscribe anytime.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
