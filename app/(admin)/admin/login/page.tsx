/**
 * Paint & Keep - Admin Login Page
 *
 * Login form for admin users. Authenticates against the Admin model
 * and redirects to the admin dashboard on success.
 *
 * Requirements: 14.8
 */

'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ensure CSRF token cookie is set by making a GET request
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf-token='))
        ?.split('=')[1];

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.');
        return;
      }

      // Successful login — redirect to admin dashboard
      router.push('/admin');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
            <span className="text-3xl" aria-hidden="true">🎨</span>
          </div>
          <h1 className="font-heading text-display-sm text-brand-dark">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to manage Paint & Keep
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-8 shadow-card"
          noValidate
        >
          {/* Error message */}
          {error && (
            <div
              className="mb-6 rounded-lg border border-status-error/20 bg-status-error/5 px-4 py-3 text-sm text-status-error"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="mb-5">
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@paintandkeep.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all hover:bg-brand-primary/90 hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Back to storefront link */}
          <p className="mt-6 text-center text-xs text-text-muted">
            Not an admin?{' '}
            <a
              href="/"
              className="text-brand-primary hover:underline"
            >
              Return to storefront
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
