'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: {
      id: string;
      name: string;
      slug: string;
      image: { url: string; alt: string } | null;
    };
  }[];
}

interface CustomerWishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: { url: string; alt: string } | null;
  };
}

interface CustomerReview {
  id: string;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  provider: string;
  emailVerified: boolean;
  isActive: boolean;
  subscribedMarketing: boolean;
  lifetimeSpend: number;
  points: number;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  wishlistCount: number;
  reviewCount: number;
  orders: CustomerOrder[];
  wishlist: CustomerWishlistItem[];
  reviews: CustomerReview[];
}

// ─── Helper Components ─────────────────────────────────────────────────────────

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 text-gray-300">{icon}</div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Customer Detail Page
 *
 * Displays full customer profile with:
 * - Name, email, registration date, account status
 * - Email subscription status with toggle
 * - Lifetime spend and points
 * - Purchase history (most recent 50 orders)
 * - Wishlist contents (up to 100 items)
 * - Review history (up to 50 reviews)
 * - Empty-state indicators for missing data sections
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.6
 */
export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingSubscription, setTogglingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Customer not found');
        } else {
          setError('Failed to load customer details');
        }
        return;
      }
      const data: CustomerDetail = await res.json();
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  /**
   * Toggle email subscription status.
   * On failure, display error and retain previous state (Requirement 17.3).
   */
  const handleToggleSubscription = async () => {
    if (!customer) return;
    setTogglingSubscription(true);
    setSubscriptionError(null);

    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribedMarketing: !customer.subscribedMarketing,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update subscription status');
      }

      // Update local state on success
      setCustomer((prev) =>
        prev ? { ...prev, subscribedMarketing: !prev.subscribedMarketing } : prev
      );
    } catch (err) {
      console.error('Error toggling subscription:', err);
      // Requirement 17.3: display error and retain previous state
      setSubscriptionError('Failed to update subscription status. Please try again.');
    } finally {
      setTogglingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading customer details...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">{error || 'Customer not found'}</p>
          <button
            onClick={() => router.push('/admin/customers')}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header / Back */}
      <div className="mb-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
      </div>

      {/* Profile Header */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-brand-dark text-xl font-bold text-white">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-600">{customer.email}</p>
              {customer.phone && (
                <p className="text-sm text-gray-500">{customer.phone}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    customer.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {customer.provider === 'GOOGLE' ? 'Google Account' : 'Email Account'}
                </span>
                {customer.emailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ₹{customer.lifetimeSpend.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500">Lifetime Spend</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{customer.orderCount}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{customer.points}</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
          </div>
        </div>

        {/* Registration date + Subscription Toggle */}
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Registered on{' '}
            {new Date(customer.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          {/* Email Subscription Toggle (Requirement 17.2) */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Email Subscription:</span>
            <button
              onClick={handleToggleSubscription}
              disabled={togglingSubscription}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                customer.subscribedMarketing ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={customer.subscribedMarketing}
              aria-label="Toggle email subscription"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  customer.subscribedMarketing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${customer.subscribedMarketing ? 'text-blue-600' : 'text-gray-500'}`}>
              {customer.subscribedMarketing ? 'Subscribed' : 'Unsubscribed'}
            </span>
          </div>
        </div>

        {/* Subscription error message (Requirement 17.3) */}
        {subscriptionError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{subscriptionError}</p>
          </div>
        )}
      </div>

      {/* Purchase History Section */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Purchase History
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({customer.orderCount} total)
            </span>
          </h2>
        </div>
        <div className="p-6">
          {customer.orders.length === 0 ? (
            // Empty state indicator (Requirement 17.6)
            <EmptyState
              message="No purchase history yet."
              icon={
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
              {customer.orderCount > 50 && (
                <p className="text-center text-xs text-gray-500 pt-2">
                  Showing most recent 50 of {customer.orderCount} orders.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Wishlist Section */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Wishlist
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({customer.wishlistCount} items)
            </span>
          </h2>
        </div>
        <div className="p-6">
          {customer.wishlist.length === 0 ? (
            // Empty state indicator (Requirement 17.6)
            <EmptyState
              message="No wishlist items."
              icon={
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customer.wishlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                >
                  {item.product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.image.url}
                      alt={item.product.image.alt}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{item.product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              {customer.wishlistCount > 100 && (
                <p className="col-span-full text-center text-xs text-gray-500 pt-2">
                  Showing first 100 of {customer.wishlistCount} items.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Reviews
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({customer.reviewCount} total)
            </span>
          </h2>
        </div>
        <div className="p-6">
          {customer.reviews.length === 0 ? (
            // Empty state indicator (Requirement 17.6)
            <EmptyState
              message="No reviews submitted."
              icon={
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {customer.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {review.product.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <StatusBadge status={review.status} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {review.text}
                  </p>
                </div>
              ))}
              {customer.reviewCount > 50 && (
                <p className="text-center text-xs text-gray-500 pt-2">
                  Showing most recent 50 of {customer.reviewCount} reviews.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
