'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminDataTable, type Column, type SortState, type PaginationState } from '@/components/admin/AdminDataTable';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  ageGroup: string;
  isPublished: boolean;
  isFeatured: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  status: 'published' | 'draft' | 'out_of_stock';
  createdAt: string;
  category: { id: string; name: string; slug: string };
  images: { url: string; alt: string }[];
}

interface ProductListResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Products List Page
 *
 * Displays all products with AdminDataTable including:
 * - Name, price, stock (with low-stock warnings), category, status columns
 * - Sorting by name, price, stock, created date
 * - Filtering by category, status
 * - Search by product name
 * - Pagination
 * - Actions: Edit, Delete
 *
 * Requirements: 15.1, 15.5, 15.7, 15.8
 */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ product: AdminProduct; pendingOrders?: number } | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ successCount: number; failedCount: number; errors: { row: number; errors: string[] }[] } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.pageSize));

      if (sort.direction) {
        params.set('sortKey', sort.key);
        params.set('sortDir', sort.direction);
      }

      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');

      const data: ProductListResponse = await res.json();
      setProducts(data.products);
      setPagination((prev) => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, filters, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = useCallback(async (product: AdminProduct) => {
    // First check for pending orders
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
    const data = await res.json();

    if (data.warning && data.requiresConfirmation) {
      setDeleteModal({ product, pendingOrders: data.pendingOrders });
    } else if (data.success) {
      fetchProducts();
    }
  }, [fetchProducts]);

  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return;

    const res = await fetch(`/api/admin/products/${deleteModal.product.id}?confirmDelete=true`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setDeleteModal(null);
      fetchProducts();
    }
  }, [deleteModal, fetchProducts]);

  const handleBulkUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);

      if (data.successCount > 0) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
    }
  }, [fetchProducts]);

  // Column definitions
  const columns: Column<AdminProduct>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.images[0].url}
              alt={item.images[0].alt}
              className="h-10 w-10 rounded-md object-cover"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (item) => <span className="font-medium">₹{item.price.toFixed(2)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            item.isOutOfStock
              ? 'text-red-600'
              : item.isLowStock
                ? 'text-amber-600'
                : 'text-green-600'
          }`}>
            {item.stock}
          </span>
          {item.isOutOfStock && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Out of Stock
            </span>
          )}
          {item.isLowStock && !item.isOutOfStock && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Low Stock
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          {item.category.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const statusStyles = {
          published: 'bg-green-100 text-green-700',
          draft: 'bg-gray-100 text-gray-700',
          out_of_stock: 'bg-red-100 text-red-700',
        };
        const statusLabels = {
          published: 'Published',
          draft: 'Draft',
          out_of_stock: 'Out of Stock',
        };
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
            {statusLabels[item.status]}
          </span>
        );
      },
    },
  ];

  // Filter configurations
  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
        { label: 'Out of Stock', value: 'out_of_stock' },
        { label: 'Low Stock', value: 'low_stock' },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setBulkUploadOpen(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Bulk Upload
          </button>
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={products}
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
        searchPlaceholder="Search products..."
        loading={loading}
        emptyMessage="No products found. Create your first product to get started."
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/products/${item.id}/edit`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(item)}
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
            <h2 className="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteModal.product.name}</strong>?
            </p>
            {deleteModal.pendingOrders && deleteModal.pendingOrders > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm font-medium text-amber-800">
                  ⚠️ Warning: This product has {deleteModal.pendingOrders} pending order(s).
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Deleting this product may affect order fulfillment.
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
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {bulkUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Bulk Product Upload</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload a CSV file to create multiple products at once. Maximum 10MB, 1000 rows.
            </p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-gray-600">Required columns:</p>
              <code className="block rounded-md bg-gray-100 p-2 text-xs text-gray-700">
                name, description, price, category, ageGroup, difficultyLevel
              </code>
              <p className="mt-1 text-xs text-gray-500">
                Optional: stock, seoTitle, seoDescription
              </p>
            </div>

            <div className="mt-4">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBulkUpload(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {uploadResult && (
              <div className="mt-4 rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">
                    ✓ {uploadResult.successCount} created
                  </span>
                  {uploadResult.failedCount > 0 && (
                    <span className="text-red-600 font-medium">
                      ✗ {uploadResult.failedCount} failed
                    </span>
                  )}
                </div>
                {uploadResult.errors.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((err, i) => (
                      <div key={i} className="mt-1 text-xs text-red-600">
                        Row {err.row}: {err.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setBulkUploadOpen(false);
                  setUploadResult(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
