'use client';

/**
 * Paint & Keep - Account Profile Page
 *
 * Displays and allows editing of user profile information:
 * name, email (read-only), phone, and profile picture.
 *
 * Requirements: 13.4, 13.5
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { UploadResult } from '@/lib/image-upload';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  profileImage: string | null;
  provider: string;
  emailVerified: boolean;
  points: number;
  createdAt: string;
}

export default function AccountPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/account/profile', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProfile(data.user);
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
      setProfileImage(data.user.profileImage || null);
    } catch {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          phone: phone || null,
          profileImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (results: UploadResult[]) => {
    if (results.length > 0) {
      setProfileImage(results[0].key);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-gray-200" />
          <div className="space-y-4">
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
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
          <Link href="/account" className="font-semibold text-brand-dark">
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
          <Link href="/account/settings" className="text-gray-600 hover:text-brand-dark">
            Settings
          </Link>
        </nav>

        <h1 className="mb-6 text-display-sm text-brand-dark">My Profile</h1>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div>
            {profileImage && (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileImage.startsWith('http') ? profileImage : `/api/upload/${profileImage}`}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
            )}
            <ImageUploader
              maxFiles={1}
              folder="profile-pictures"
              label="Profile Picture"
              onUpload={handleImageUpload}
              onError={(err) => setError(err)}
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <p className="mt-1 text-xs text-gray-500">{name.length}/100 characters</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed.{' '}
              {profile?.emailVerified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <span className="text-amber-600">Not verified</span>
              )}
            </p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <p className="mt-1 text-xs text-gray-500">E.164 format (e.g., +919876543210)</p>
          </div>

          {/* Points display */}
          {profile && (
            <div className="rounded-md bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                🎨 Reward Points: <span className="text-lg">{profile.points}</span>
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-md bg-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
