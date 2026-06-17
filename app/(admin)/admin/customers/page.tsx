'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminDataTable, type Column, type SortState, type PaginationState } from '@/components/admin/AdminDataTable';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  subscribedMarketing: boolean;
  lifetimeSpend: number;
  createdAt: string;
  orderCount: number;
  wishlistCount: number;
  reviewCount: number;
}

interface CustomerListResponse {
  customers: AdminCustomer[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Customers List Page
 *
 * Displays all customers with:
 * - Search by name/email (partial match)
 * - Filters: date range, lifetime value range
 * - Pagination at 20 customers per page
 * - Columns: name, email, status, subscription, lifetime spend, orders, registration date
 * - Action: View detail
 *
 * Requirements: 17.1, 17.2, 17.5
 */
export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Additional date/value range filters (beyond the AdminDataTable select filters)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minLifetimeValue, setMinLifetimeValue] = useState('');
  const [maxLifetimeValue, setMaxLifetimeValue] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.pageSize));

      if (sort.direction) {
        params.set('sortKey', sort.key);
        params.set('sortDir', sort.direction);
      }

      if (searchQuery) params.set('search', searchQuery);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (minLifetimeValue) params.set('minLifetimeValue', minLifetimeValue);
      if (maxLifetimeValue) params.set('maxLifetimeValue', maxLifetimeValue);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch customers');

      const data: CustomerListResponse = await res.json();
      setCustomers(data.customers);
      setPagination((prev) => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, searchQuery, dateFrom, dateTo, minLifetimeValue, maxLifetimeValue]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMinLifetimeValue('');
    setMaxLifetimeValue('');
    setSearchQuery('');
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Column definitions
  const columns: Column<AdminCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.name}</p>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            item.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'subscribedMarketing',
      header: 'Email Subscription',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            item.subscribedMarketing
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.subscribedMarketing ? (
            <>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Subscribed
            </>
          ) : (
            'Unsubscribed'
          )}
        </span>
      ),
    },
    {
      key: 'lifetimeSpend',
      header: 'Lifetime Spend',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-gray-900">
          ₹{item.lifetimeSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'orderCount',
      header: 'Orders',
      render: (item) => (
        <span className="text-gray-700">{item.orderCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registered',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-gray-600">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const hasActiveFilters = dateFrom || dateTo || minLifetimeValue || maxLifetimeValue;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage customer profiles and activity
        </p>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Filters</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-600 mb-1">
              Registered From
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-xs font-medium text-gray-600 mb-1">
              Registered To
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Min Lifetime Value */}
          <div>
            <label htmlFor="minLifetimeValue" className="block text-xs font-medium text-gray-600 mb-1">
              Min Lifetime Value (₹)
            </label>
            <input
              id="minLifetimeValue"
              type="number"
              min="0"
              step="100"
              value={minLifetimeValue}
              onChange={(e) => setMinLifetimeValue(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Max Lifetime Value */}
          <div>
            <label htmlFor="maxLifetimeValue" className="block text-xs font-medium text-gray-600 mb-1">
              Max Lifetime Value (₹)
            </label>
            <input
              id="maxLifetimeValue"
              type="number"
              min="0"
              step="100"
              value={maxLifetimeValue}
              onChange={(e) => setMaxLifetimeValue(e.target.value)}
              placeholder="No limit"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleApplyFilters}
            className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={customers}
        getRowKey={(item) => item.id}
        filters={[]}
        activeFilters={filters}
        onFilterChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or email..."
        loading={loading}
        emptyMessage="No customers found. Try adjusting your search or filters."
        actions={(item) => (
          <Link
            href={`/admin/customers/${item.id}`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View
          </Link>
        )}
      />
    </div>
  );
}
