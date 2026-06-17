'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AdminDataTable,
  type Column,
  type SortState,
  type PaginationState,
  type FilterConfig,
} from '@/components/admin/AdminDataTable';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
}

interface OrderListResponse {
  success: boolean;
  orders: OrderSummary[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Status Helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
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

const PAYMENT_LABELS: Record<string, string> = {
  RAZORPAY: 'Razorpay',
  STRIPE: 'Stripe',
};

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Orders List Page
 *
 * Displays all orders with AdminDataTable including:
 * - Order number, customer name, status (colored badges), total, payment method, date
 * - Filtering by status, date range, customer search, payment method
 * - Pagination (max 50 per page)
 * - Click row to view order details
 *
 * Requirements: 16.5, 16.6
 */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.pageSize));

      if (filters.status) params.set('status', filters.status);
      if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
      if (searchQuery) params.set('customer', searchQuery);
      if (dateFrom) params.set('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo) params.set('dateTo', new Date(dateTo).toISOString());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');

      const data: OrderListResponse = await res.json();
      setOrders(data.orders);
      setPagination((prev) => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Column definitions
  const columns: Column<OrderSummary>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (item) => (
        <Link
          href={`/admin/orders/${item.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {item.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.customerName}</p>
          <p className="text-xs text-gray-500">{item.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {STATUS_LABELS[item.status] || item.status}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-gray-900">₹{item.total.toFixed(2)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (item) => (
        <span className="text-sm text-gray-700">
          {PAYMENT_LABELS[item.paymentMethod] || item.paymentMethod}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-gray-600">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Processing', value: 'PROCESSING' },
        { label: 'Shipped', value: 'SHIPPED' },
        { label: 'Delivered', value: 'DELIVERED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Refunded', value: 'REFUNDED' },
      ],
      placeholder: 'All Statuses',
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      options: [
        { label: 'Razorpay', value: 'RAZORPAY' },
        { label: 'Stripe', value: 'STRIPE' },
      ],
      placeholder: 'All Payments',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and track customer orders
        </p>
      </div>

      {/* Date Range Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">
            From:
          </label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dateTo" className="text-sm font-medium text-gray-700">
            To:
          </label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={orders}
        getRowKey={(item) => item.id}
        filters={filterConfigs}
        activeFilters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        sort={sort}
        onSortChange={setSort}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        searchPlaceholder="Search by customer name or email..."
        loading={loading}
        emptyMessage="No orders found matching your criteria."
        actions={(item) => (
          <Link
            href={`/admin/orders/${item.id}`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View
          </Link>
        )}
      />
    </div>
  );
}
