'use client';

/**
 * Paint & Keep - Account Settings Page
 *
 * Notification preferences with opt-in/opt-out controls.
 * Covers order notifications, shipping updates, badges, and marketing emails.
 *
 * Requirements: 13.4
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/lib/hooks/useAuth';

interface Preference {
  id: string;
  type: string;
  optedIn: boolean;
}

const PREFERENCE_LABELS: Record<string, { label: string; description: string }> = {
  ORDER_CONFIRMATION: {
    label: 'Order Confirmations',
    description: 'Email when your order is placed successfully',
  },
  SHIPPING_UPDATE: {
    label: 'Shipping Updates',
    description: 'Email when your order ships or has tracking updates',
  },
  DELIVERY_CONFIRMATION: {
    label: 'Delivery Confirmations',
    description: 'Email when your order is delivered',
  },
  BADGE_EARNED: {
    label: 'Badge Notifications',
    description: 'Email when you earn a new badge or achievement',
  },
};

export default function SettingsPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/account/preferences', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load preferences');
      const data = await res.json();
      setPreferences(data.preferences);
      setMarketingEmails(data.marketingEmails);
    } catch {
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

  const handleToggle = async (type: string, currentValue: boolean) => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          preferences: { [type]: !currentValue },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update');
      }

      const data = await res.json();
      setPreferences(data.preferences);
      setSuccess('Preference updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarketingToggle = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          marketingEmails: !marketingEmails,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update');
      }

      const data = await res.json();
      setMarketingEmails(data.marketingEmails);
      setSuccess('Marketing preference updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        {/* Navigation */}
        <nav className="mb-8 flex flex-wrap gap-4 text-sm" aria-label="Account navigation">
          <Link href="/account" className="text-gray-600 hover:text-brand-dark">
            Profile
          </Link>
          <Link href="/account/addresses" className="text-gray-600 hover:text-brand-dark">
            Addresses
          </Link>
          <Link href="/account/orders" className="text-gray-600 hover:text-brand-dark">
            Orders
          </Link>
          <Link href="/account/wishlist" className="text-gray-600 hover:text-brand-dark">
            Wishlist
          </Link>
          <Link href="/account/settings" className="font-semibold text-brand-dark">
            Settings
          </Link>
        </nav>

        <h1 className="mb-6 text-display-sm text-brand-dark">Notification Settings</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700" role="status">
            {success}
          </div>
        )}

        {/* Order & Activity Notifications */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order & Activity Notifications</h2>
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {preferences.map((pref) => {
              const meta = PREFERENCE_LABELS[pref.type];
              if (!meta) return null;

              return (
                <div key={pref.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                    <p className="text-xs text-gray-500">{meta.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(pref.type, pref.optedIn)}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 ${
                      pref.optedIn ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={pref.optedIn}
                    aria-label={`${meta.label} ${pref.optedIn ? 'enabled' : 'disabled'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        pref.optedIn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Marketing Emails */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Marketing & Promotions</h2>
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                <p className="text-xs text-gray-500">
                  Receive newsletters, offers, and product updates
                </p>
              </div>
              <button
                onClick={handleMarketingToggle}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 ${
                  marketingEmails ? 'bg-brand-primary' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={marketingEmails}
                aria-label={`Marketing emails ${marketingEmails ? 'enabled' : 'disabled'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    marketingEmails ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs text-gray-400">
          Note: Transactional emails (password reset, email verification) cannot be disabled
          as they are required for account security.
        </p>
      </div>
    </div>
  );
}
