'use client';

/**
 * Paint & Keep - Order History Page
 *
 * Displays paginated order history (20 per page) with status badges.
 * Supports filtering by status.
 *
 * Requirements: 13.7
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/lib/hooks/useAuth';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  total: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string }[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discount: string;
  shippingCost: string;
  total: string;
  paymentMethod: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItem[];
  address: {
    city: string;
    state: string;
  };
}

interface Pagination {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Paid', className: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: 'Processing', className: 'bg-indigo-100 text-indigo-800' },
  SHIPPED: { label: 'Shipped', className: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' },
};

const ALL_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function OrdersPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = useCallback(async (page: number, status: string) => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (status) params.set('status', status);

      const res = await fetch(`/api/account/orders?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(currentPage, statusFilter);
    }
  }, [isAuthenticated, currentPage, statusFilter, fetchOrders]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (authLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        {/* Navigation */}
        <nav className="mb-8 flex flex-wrap gap-4 text-sm" aria-label="Account navigation">
          <Link href="/account" className="text-gray-600 hover:text-brand-dark">
            Profile
          </Link>
          <Link href="/account/addresses" className="text-gray-600 hover:text-brand-dark">
            Addresses
          </Link>
          <Link href="/account/orders" className="font-semibold text-brand-dark">
            Orders
          </Link>
          <Link href="/account/wishlist" className="text-gray-600 hover:text-brand-dark">
            Wishlist
          </Link>
          <Link href="/account/settings" className="text-gray-600 hover:text-brand-dark">
            Settings
          </Link>
        </nav>

        <h1 className="mb-6 text-display-sm text-brand-dark">Order History</h1>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {STATUS_BADGES[status].label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              {statusFilter ? 'No orders with this status.' : 'No orders yet.'}
            </p>
            <Link
              href="/shop"
              className="mt-3 inline-block text-sm font-medium text-brand-primary hover:underline"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Order List */}
            <div className="space-y-4">
              {orders.map((order) => {
                const badge = STATUS_BADGES[order.status] || STATUS_BADGES.PENDING;
                return (
                  <div
                    key={order.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                      </div>
                    </div>

                    {/* Order items preview */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1"
                        >
                          {item.product.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.images[0].alt}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="max-w-[120px] truncate text-xs font-medium">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="flex items-center text-xs text-gray-500">
                          +{order.items.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Tracking info */}
                    {order.trackingNumber && (
                      <p className="mt-2 text-xs text-gray-500">
                        Tracking: {order.trackingCarrier} - {order.trackingNumber}
                      </p>
                    )}
                    {order.estimatedDelivery && (
                      <p className="text-xs text-gray-500">
                        Est. delivery: {formatDate(order.estimatedDelivery)}
                      </p>
                    )}

                    {/* Shipping address summary */}
                    <p className="mt-1 text-xs text-gray-400">
                      Shipped to: {order.address.city}, {order.address.state}
                    </p>

                    {/* View Detail Link */}
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-sm font-medium text-brand-primary hover:underline"
                      >
                        View Order Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Order pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}

            {pagination && (
              <p className="mt-2 text-center text-xs text-gray-400">
                Showing {orders.length} of {pagination.totalCount} orders
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
