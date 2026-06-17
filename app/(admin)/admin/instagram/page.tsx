'use client';

/**
 * Paint & Keep - Admin Instagram Moderation Page
 *
 * Displays pending Instagram posts in a moderation queue.
 * Supports approve, reject, feature actions.
 * Includes manual upload form for when automatic sync is unavailable.
 * Paginated at 50 items per page, ordered oldest first.
 *
 * Requirements: 9.4, 9.5, 18.5
 */

import { useState, useEffect, useCallback } from 'react';

import ModerationQueue, {
  type ModerationItem,
  type ModerationAction,
} from '@/components/admin/ModerationQueue';

/* ─── Constants ────────────────────────────────────────────────────────── */

const ITEMS_PER_PAGE = 50;

/* ─── Page Component ───────────────────────────────────────────────────── */

export default function AdminInstagramPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED' | 'all'>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        orderBy: 'oldest',
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/admin/instagram?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch Instagram posts');

      const data = await res.json();
      setItems(
        data.items.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          type: 'instagram' as const,
          imageUrl: item.imageUrl as string,
          title: `@${item.username}`,
          subtitle: item.postUrl ? 'Instagram Post' : 'Manual Upload',
          description: item.caption as string,
          metadata: {
            Likes: item.likeCount as number,
            Date: new Date(item.postDate as string).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          },
          status: item.status as ModerationItem['status'],
          isFeatured: item.isFeatured as boolean,
          createdAt: item.createdAt as string,
        }))
      );
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAction = useCallback(
    async (action: ModerationAction) => {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Moderation action failed');
      }

      await fetchItems();
    },
    [fetchItems]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instagram Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate Instagram posts from #PaintAndKeep community
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual Upload Button */}
          <button
            type="button"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="text-sm font-medium px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showUploadForm ? 'Cancel Upload' : '+ Manual Upload'}
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
            aria-label="Filter by status"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="FEATURED">Featured</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Manual Upload Form */}
      {showUploadForm && (
        <ManualUploadForm
          onSuccess={() => {
            setShowUploadForm(false);
            fetchItems();
          }}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={fetchItems} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Moderation Queue */}
      <ModerationQueue
        items={items}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        onAction={handleAction}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}

/* ─── Manual Upload Form ───────────────────────────────────────────────── */

function ManualUploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: '',
    caption: '',
    postUrl: '',
    postDate: new Date().toISOString().split('T')[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError('Image must be less than 10MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setImageFile(file);
    setFormError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!imageFile) {
      setFormError('Image is required');
      return;
    }

    if (!formData.username.trim()) {
      setFormError('Username is required');
      return;
    }

    if (!formData.caption.trim()) {
      setFormError('Caption is required');
      return;
    }

    if (!formData.postDate) {
      setFormError('Post date is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('image', imageFile);
      submitData.append('username', formData.username.trim());
      submitData.append('caption', formData.caption.trim());
      submitData.append('postDate', formData.postDate);
      if (formData.postUrl.trim()) {
        submitData.append('postUrl', formData.postUrl.trim());
      }

      const res = await fetch('/api/admin/instagram/upload', {
        method: 'POST',
        body: submitData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        onSuccess();
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Manual Instagram Post Upload
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Upload an Instagram post manually when automatic sync is unavailable.
      </p>

      {formSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ Post uploaded successfully! It will appear in the moderation queue.
        </div>
      )}

      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Image <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block py-6">
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Click to upload image</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 10MB</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="instagram-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 mr-1">@</span>
              <input
                id="instagram-username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="paintandkeep"
                maxLength={100}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="instagram-caption" className="block text-sm font-medium text-gray-700 mb-1">
              Caption <span className="text-red-500">*</span>
            </label>
            <textarea
              id="instagram-caption"
              value={formData.caption}
              onChange={(e) => setFormData((prev) => ({ ...prev, caption: e.target.value }))}
              placeholder="Post caption..."
              maxLength={2200}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{formData.caption.length}/2200</p>
          </div>

          <div>
            <label htmlFor="instagram-post-date" className="block text-sm font-medium text-gray-700 mb-1">
              Post Date <span className="text-red-500">*</span>
            </label>
            <input
              id="instagram-post-date"
              type="date"
              value={formData.postDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, postDate: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="instagram-post-url" className="block text-sm font-medium text-gray-700 mb-1">
              Post URL <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="instagram-post-url"
              type="url"
              value={formData.postUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, postUrl: e.target.value }))}
              placeholder="https://www.instagram.com/p/..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Uploading...' : 'Upload Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
