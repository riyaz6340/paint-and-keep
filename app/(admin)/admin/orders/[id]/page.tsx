'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  total: number;
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

interface StatusHistoryEntry {
  id: string;
  status: string;
  adminId: string | null;
  adminName: string | null;
  note: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentId: string | null;
  giftNote: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDetail[];
  address: OrderAddress;
  statusHistory: StatusHistoryEntry[];
}

// ─── Status Constants ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

/**
 * Valid transitions from each status.
 * Matches the state machine defined in OrderService.
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

const PAYMENT_LABELS: Record<string, string> = {
  RAZORPAY: 'Razorpay',
  STRIPE: 'Stripe',
};

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Order Detail Page
 *
 * Displays full order details with:
 * - Customer info (name, email)
 * - Order items with quantities, prices
 * - Payment status and method
 * - Shipping address
 * - Chronological status history (timestamps + admin identity)
 * - Status update controls with transition validation
 * - Tracking info for shipped/delivered orders
 * - Cancellation and refund flows with confirmation dialogs
 *
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.7, 16.8
 */
export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    action: string;
    status: string;
    message: string;
  } | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch order');
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  /**
   * Handles status transition with confirmation for cancel/refund.
   */
  const handleStatusUpdate = useCallback(
    async (newStatus: string) => {
      // For cancellation or refund, show confirmation dialog
      if (newStatus === 'CANCELLED') {
        setConfirmDialog({
          action: 'cancel',
          status: newStatus,
          message:
            'Are you sure you want to cancel this order? This will notify the customer and cannot be easily undone.',
        });
        return;
      }

      if (newStatus === 'REFUNDED') {
        setConfirmDialog({
          action: 'refund',
          status: newStatus,
          message:
            'Are you sure you want to process a refund for this order? This will initiate a payment reversal through the original payment method.',
        });
        return;
      }

      // For other transitions, proceed directly
      await performStatusUpdate(newStatus);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * Performs the actual PATCH request to update order status.
   */
  const performStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || `Failed to update order status to ${STATUS_LABELS[newStatus]}`
        );
      }

      const data = await res.json();
      setOrder(data.order);
      setStatusNote('');
      setConfirmDialog(null);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Confirms the cancellation or refund action from the dialog.
   */
  const confirmAction = () => {
    if (confirmDialog) {
      performStatusUpdate(confirmDialog.status);
    }
  };

  // ─── Loading / Error States ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm font-medium text-red-800">
            {error || 'Order not found'}
          </p>
          <button
            onClick={() => router.push('/admin/orders')}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
  const showTracking =
    order.status === 'SHIPPED' || order.status === 'DELIVERED';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Orders
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`inline-flex self-start rounded-full border px-3 py-1 text-sm font-semibold ${
              STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Items + Status Update */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Order Items ({order.items.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-400">IMG</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">
                    ₹{item.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">₹{order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Gift Note */}
            {order.giftNote && (
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">Gift Note:</p>
                <p className="text-sm text-yellow-900">{order.giftNote}</p>
              </div>
            )}
          </section>

          {/* Status Update Controls */}
          {allowedNext.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Update Status
              </h2>

              {updateError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{updateError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="statusNote"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Note (optional)
                  </label>
                  <textarea
                    id="statusNote"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add a note about this status change..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {allowedNext.map((nextStatus) => {
                    const isCancelOrRefund =
                      nextStatus === 'CANCELLED' || nextStatus === 'REFUNDED';
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusUpdate(nextStatus)}
                        disabled={updating}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isCancelOrRefund
                            ? 'border border-red-300 text-red-700 hover:bg-red-50'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {updating ? 'Updating...' : `Move to ${STATUS_LABELS[nextStatus]}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Tracking Information */}
          {showTracking && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Tracking Information
              </h2>
              {order.trackingCarrier || order.trackingNumber ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        Carrier
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {order.trackingCarrier || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        Tracking Number
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 font-mono">
                        {order.trackingNumber || 'Pending'}
                      </p>
                    </div>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        Estimated Delivery
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {new Date(order.estimatedDelivery).toLocaleDateString(
                          'en-IN',
                          { day: '2-digit', month: 'long', year: 'numeric' }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ Tracking information is not available. The shipping provider
                    data may not be current.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Status History */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Status History
            </h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No status changes recorded yet.</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

                <div className="space-y-4">
                  {order.statusHistory.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-4 pl-8">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                          index === order.statusHistory.length - 1
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              STATUS_STYLES[entry.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {STATUS_LABELS[entry.status] || entry.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {entry.adminName && (
                          <p className="mt-1 text-xs text-gray-500">
                            by {entry.adminName}
                          </p>
                        )}
                        {entry.note && (
                          <p className="mt-1 text-sm text-gray-700">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Customer, Payment, Address */}
        <div className="space-y-6">
          {/* Customer Info */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Customer
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <p className="text-sm text-gray-600">{order.customerEmail}</p>
            </div>
          </section>

          {/* Payment Info */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Payment
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Method</span>
                <span className="text-sm font-medium text-gray-900">
                  {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`text-sm font-medium ${
                    order.status === 'REFUNDED'
                      ? 'text-gray-600'
                      : order.status === 'CANCELLED'
                        ? 'text-red-600'
                        : order.status === 'PENDING'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                  }`}
                >
                  {order.status === 'PENDING'
                    ? 'Awaiting Payment'
                    : order.status === 'REFUNDED'
                      ? 'Refunded'
                      : order.status === 'CANCELLED'
                        ? 'Cancelled'
                        : 'Paid'}
                </span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reference</span>
                  <span className="text-xs font-mono text-gray-700 truncate max-w-[140px]">
                    {order.paymentId}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Shipping Address */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Shipping Address
            </h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium text-gray-900">{order.address.fullName}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} {order.address.postalCode}
              </p>
              <p>{order.address.country}</p>
              <p className="mt-2 text-gray-500">📞 {order.address.phone}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Dialog for Cancel/Refund */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-gray-900"
            >
              {confirmDialog.action === 'cancel'
                ? 'Confirm Cancellation'
                : 'Confirm Refund'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{confirmDialog.message}</p>

            {confirmDialog.action === 'refund' && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  💰 Refund amount: <strong>₹{order.total.toFixed(2)}</strong> via{' '}
                  {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                </p>
              </div>
            )}

            {statusNote && (
              <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">Note:</p>
                <p className="text-sm text-gray-700">{statusNote}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={updating}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={updating}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmDialog.action === 'refund'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {updating
                  ? 'Processing...'
                  : confirmDialog.action === 'cancel'
                    ? 'Yes, Cancel Order'
                    : 'Yes, Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
