'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminDataTable, type Column, type SortState, type PaginationState } from '@/components/admin/AdminDataTable';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CouponAnalytics {
  totalUses: number;
  totalDiscountApplied: number;
  orderReferences: { orderId: string; orderNumber: string; discount: number }[];
}

interface AdminCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxUsage: number;
  currentUsage: number;
  expiryDate: string;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
  analytics: CouponAnalytics;
}

interface CouponListResponse {
  coupons: AdminCoupon[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Coupons List Page
 *
 * Displays all coupons with AdminDataTable including:
 * - Code, discount type/value, min order, usage count/max, expiry, active status
 * - Usage analytics: total uses, total discount applied
 * - Activate/deactivate toggle
 * - CRUD actions: Edit, Delete
 *
 * Requirements: 19.1, 19.4, 19.5
 */
export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<AdminCoupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.pageSize));

      if (sort.direction) {
        params.set('sortKey', sort.key);
        params.set('sortDir', sort.direction);
      }

      if (filters.status) params.set('status', filters.status);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch coupons');

      const data: CouponListResponse = await res.json();
      setCoupons(data.coupons);
      setPagination((prev) => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, filters, searchQuery]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleToggleActive = useCallback(async (coupon: AdminCoupon) => {
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
    } finally {
      setTogglingId(null);
    }
  }, [fetchCoupons]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal) return;

    try {
      const res = await fetch(`/api/admin/coupons/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteModal(null);
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  }, [deleteModal, fetchCoupons]);

  // Format expiry date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Column definitions
  const columns: Column<AdminCoupon>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-semibold text-gray-900">{item.code}</span>
      ),
    },
    {
      key: 'discountValue',
      header: 'Discount',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-gray-900">
          {item.discountType === 'PERCENTAGE'
            ? `${item.discountValue}%`
            : `₹${item.discountValue.toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Min Order',
      render: (item) => (
        <span className="text-gray-700">
          {item.minOrderAmount > 0 ? `₹${item.minOrderAmount.toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'currentUsage',
      header: 'Usage',
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {item.currentUsage} / {item.maxUsage}
          </span>
          <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.min((item.currentUsage / item.maxUsage) * 100, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`text-sm ${item.isExpired ? 'text-red-600' : 'text-gray-700'}`}>
            {formatDate(item.expiryDate)}
          </span>
          {item.isExpired && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Expired
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(item);
          }}
          disabled={togglingId === item.id}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          style={{ backgroundColor: item.isActive ? '#10b981' : '#d1d5db' }}
          aria-label={item.isActive ? 'Deactivate coupon' : 'Activate coupon'}
          title={item.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              item.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'analytics',
      header: 'Analytics',
      render: (item) => (
        <div className="flex flex-col text-xs text-gray-600">
          <span>{item.analytics.totalUses} uses</span>
          <span className="font-medium text-gray-800">
            ₹{item.analytics.totalDiscountApplied.toFixed(2)} total discount
          </span>
        </div>
      ),
    },
  ];

  // Filter configurations
  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Expired', value: 'expired' },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage discount coupons and promotional codes
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + New Coupon
        </Link>
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={coupons}
        getRowKey={(item) => item.id}
        filters={filterConfigs}
        activeFilters={filters}
        onFilterChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by coupon code..."
        loading={loading}
        emptyMessage="No coupons found. Create your first coupon to get started."
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/coupons/${item.id}/edit`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <button
              onClick={() => setDeleteModal(item)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        )}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Delete Coupon</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete coupon <strong className="font-mono">{deleteModal.code}</strong>?
              This action cannot be undone.
            </p>
            {deleteModal.currentUsage > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ This coupon has been used {deleteModal.currentUsage} time(s).
                  Deleting it will remove the coupon reference from associated orders.
                </p>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
