'use client';

/**
 * Paint & Keep - Order Detail Page
 *
 * Displays full order detail with:
 * - Visual status timeline/stepper showing order progression
 * - Tracking information (carrier, number) for shipped/delivered orders
 * - Order items with product info
 * - Shipping address and payment details
 *
 * Requirements: 13.7, 13.8
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderDetail {
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
  giftNote: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: OrderAddress;
  statusHistory: StatusHistoryEntry[];
}

/** Ordered statuses representing the normal happy-path progression */
const STATUS_PROGRESSION = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

/** Terminal/alternative statuses that break the normal flow */
const TERMINAL_STATUSES = ['CANCELLED', 'REFUNDED'] as const;

const STATUS_META: Record<string, { label: string; className: string; icon: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  PAID: { label: 'Paid', className: 'bg-blue-100 text-blue-800', icon: '💳' },
  PROCESSING: { label: 'Processing', className: 'bg-indigo-100 text-indigo-800', icon: '📦' },
  SHIPPED: { label: 'Shipped', className: 'bg-purple-100 text-purple-800', icon: '🚚' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800', icon: '✅' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: '❌' },
  REFUNDED: { label: 'Refunded', className: 'bg-gray-100 text-gray-800', icon: '↩️' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/account/orders/${orderId}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Order not found');
        throw new Error('Failed to load order details');
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrder();
    }
  }, [isAuthenticated, orderId, fetchOrder]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="mb-6 h-8 w-64 rounded bg-gray-200" />
          <div className="mb-4 h-24 rounded-lg bg-gray-200" />
          <div className="mb-4 h-48 rounded-lg bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-md bg-red-50 p-6 text-center" role="alert">
            <p className="text-red-700">{error}</p>
            <Link
              href="/account/orders"
              className="mt-3 inline-block text-sm font-medium text-brand-primary hover:underline"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isTerminalStatus = (TERMINAL_STATUSES as readonly string[]).includes(order.status);
  const currentStatusIndex = STATUS_PROGRESSION.indexOf(
    order.status as (typeof STATUS_PROGRESSION)[number]
  );

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        {/* Back Navigation */}
        <Link
          href="/account/orders"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-brand-dark"
        >
          ← Back to Orders
        </Link>

        {/* Order Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-display-sm text-brand-dark">
              Order #{order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_META[order.status]?.className || 'bg-gray-100 text-gray-800'}`}
            >
              {STATUS_META[order.status]?.icon} {STATUS_META[order.status]?.label || order.status}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6" aria-label="Order status timeline">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Progress</h2>

          {isTerminalStatus ? (
            /* Terminal status display */
            <div className="flex items-center gap-3 rounded-md bg-red-50 p-4">
              <span className="text-2xl">{STATUS_META[order.status]?.icon}</span>
              <div>
                <p className="font-medium text-red-800">
                  {STATUS_META[order.status]?.label}
                </p>
                {order.statusHistory.length > 0 && (
                  <p className="text-sm text-red-600">
                    {formatDateTime(order.statusHistory[order.statusHistory.length - 1].createdAt)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Normal progression timeline */
            <div className="relative">
              <div className="flex items-center justify-between">
                {STATUS_PROGRESSION.map((status, index) => {
                  const isCompleted = currentStatusIndex >= index;
                  const isCurrent = currentStatusIndex === index;
                  const historyEntry = order.statusHistory.find((h) => h.status === status);

                  return (
                    <div key={status} className="flex flex-1 flex-col items-center">
                      {/* Connector line */}
                      {index > 0 && (
                        <div
                          className={`absolute top-4 h-0.5 ${
                            currentStatusIndex >= index
                              ? 'bg-brand-primary'
                              : 'bg-gray-200'
                          }`}
                          style={{
                            left: `${((index - 1) / (STATUS_PROGRESSION.length - 1)) * 100 + 100 / (STATUS_PROGRESSION.length - 1) / 2}%`,
                            width: `${100 / (STATUS_PROGRESSION.length - 1) - 100 / (STATUS_PROGRESSION.length - 1) / 2}%`,
                          }}
                        />
                      )}

                      {/* Status circle */}
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                          isCurrent
                            ? 'scale-110 bg-brand-primary text-white ring-4 ring-brand-primary/20'
                            : isCompleted
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>

                      {/* Status label */}
                      <p
                        className={`mt-2 text-center text-xs font-medium ${
                          isCompleted ? 'text-brand-dark' : 'text-gray-400'
                        }`}
                      >
                        {STATUS_META[status]?.label}
                      </p>

                      {/* Timestamp */}
                      {historyEntry && (
                        <p className="mt-0.5 text-center text-[10px] text-gray-400">
                          {formatDateTime(historyEntry.createdAt)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Tracking Information */}
        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') &&
          order.trackingNumber && (
            <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6" aria-label="Tracking information">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Tracking Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Carrier</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {order.trackingCarrier || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Tracking Number</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {order.trackingNumber}
                  </p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Estimated Delivery
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* Order Items */}
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6" aria-label="Order items">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Items</h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3">
                {item.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.images[0].alt}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-brand-primary"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.total)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.unitPrice)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Order Summary */}
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6" aria-label="Order summary">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">{formatCurrency(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(order.total)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <span>Payment:</span>
            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium capitalize">
              {order.paymentMethod.toLowerCase()}
            </span>
          </div>
          {order.giftNote && (
            <div className="mt-4 rounded-md bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">🎁 Gift Note</p>
              <p className="mt-1 text-sm text-amber-700">{order.giftNote}</p>
            </div>
          )}
        </section>

        {/* Shipping Address */}
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6" aria-label="Shipping address">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Shipping Address</h2>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{order.address.fullName}</p>
            <p>{order.address.line1}</p>
            {order.address.line2 && <p>{order.address.line2}</p>}
            <p>
              {order.address.city}, {order.address.state} {order.address.postalCode}
            </p>
            <p>{order.address.country}</p>
            <p className="mt-2 text-gray-500">Phone: {order.address.phone}</p>
          </div>
        </section>

        {/* Status History */}
        {order.statusHistory.length > 0 && (
          <section className="rounded-lg border border-gray-200 bg-white p-6" aria-label="Status history">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status History</h2>
            <div className="space-y-3">
              {order.statusHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs">
                    {STATUS_META[entry.status]?.icon || '•'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {STATUS_META[entry.status]?.label || entry.status}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-gray-600">{entry.note}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
