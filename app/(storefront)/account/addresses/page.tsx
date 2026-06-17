'use client';

/**
 * Paint & Keep - Address Book Page
 *
 * CRUD operations for saved addresses (up to 10).
 * Allows add, edit, delete, and set default address.
 *
 * Requirements: 13.6
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/lib/hooks/useAuth';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
};

export default function AddressesPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [maxAllowed, setMaxAllowed] = useState(10);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch('/api/account/addresses', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load addresses');
      const data = await res.json();
      setAddresses(data.addresses);
      setMaxAllowed(data.maxAllowed);
    } catch {
      setError('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const url = editingId
        ? `/api/account/addresses/${editingId}`
        : '/api/account/addresses';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          line2: form.line2 || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save address');
      }

      setSuccess(editingId ? 'Address updated' : 'Address added');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setError('');
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete address');
      }

      setSuccess('Address deleted');
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isDefault: true }),
      });

      if (!res.ok) throw new Error('Failed to set default');
      fetchAddresses();
    } catch {
      setError('Failed to set default address');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full rounded bg-gray-200" />
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
          <Link href="/account/addresses" className="font-semibold text-brand-dark">
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

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-display-sm text-brand-dark">Address Book</h1>
          {addresses.length < maxAllowed && !showForm && (
            <button
              onClick={handleAdd}
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
            >
              + Add Address
            </button>
          )}
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {addresses.length}/{maxAllowed} addresses saved
        </p>

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

        {/* Address Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? 'Edit Address' : 'New Address'}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="+919876543210"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="line1" className="mb-1 block text-sm font-medium text-gray-700">
                  Address Line 1 *
                </label>
                <input
                  id="line1"
                  type="text"
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  required
                  maxLength={200}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="line2" className="mb-1 block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <input
                  id="line2"
                  type="text"
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  maxLength={200}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  id="state"
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  required
                  maxLength={10}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Set as default address
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-brand-primary px-6 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Address List */}
        {addresses.length === 0 && !showForm ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No saved addresses yet.</p>
            <button
              onClick={handleAdd}
              className="mt-3 text-sm font-medium text-brand-primary hover:underline"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{address.fullName}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{address.phone}</p>
                    <p className="text-sm text-gray-600">
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-gray-600">{address.country}</p>
                  </div>

                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs text-blue-600 hover:underline"
                        aria-label={`Set ${address.fullName} as default`}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-xs text-gray-600 hover:text-brand-primary"
                      aria-label={`Edit address for ${address.fullName}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-xs text-red-600 hover:underline"
                      aria-label={`Delete address for ${address.fullName}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
