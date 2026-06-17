'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { UploadResult } from '@/lib/image-upload';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  ageGroup: string;
  difficultyLevel: string;
  stock: string;
  lowStockThreshold: string;
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  videoUrl: string;
}

const AGE_GROUP_OPTIONS = [
  { value: 'AGES_4_6', label: 'Ages 4-6' },
  { value: 'AGES_7_9', label: 'Ages 7-9' },
  { value: 'AGES_10_12', label: 'Ages 10-12' },
  { value: 'TEENS', label: 'Teens' },
  { value: 'ADULTS', label: 'Adults' },
  { value: 'FAMILY', label: 'Family' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Create Product Page
 *
 * Form fields: name (200), description (5000), price, category, age group,
 * difficulty, images (drag-drop max 10), SEO metadata.
 *
 * Requirements: 15.1, 15.4
 */
export default function AdminCreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    ageGroup: '',
    difficultyLevel: '',
    stock: '0',
    lowStockThreshold: '10',
    isPublished: false,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    videoUrl: '',
  });
  const [images, setImages] = useState<{ url: string; alt: string; order: number }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/products?limit=1');
        // We need a categories endpoint; for now, get from admin products
        // Alternatively fetch from a dedicated endpoint
        const categoriesRes = await fetch('/api/admin/products?limit=1');
        if (categoriesRes.ok) {
          // Fetch categories separately
        }
      } catch {
        // Fallback to hardcoded categories if API unavailable
      }
    }

    // Fetch categories from prisma directly via a lightweight endpoint
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || data);
        }
      } catch {
        // Categories will be empty - admin can still type category ID
      }
    }

    loadCategories();
  }, []);

  const handleChange = useCallback((field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleImageUpload = useCallback((results: UploadResult[]) => {
    setImages((prev) => {
      const newImages = results.map((r, i) => ({
        url: r.cdnUrl,
        alt: formData.name || 'Product image',
        order: prev.length + i,
      }));
      return [...prev, ...newImages].slice(0, 10);
    });
  }, [formData.name]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Name must not exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Description must not exceed 5000 characters';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      newErrors.price = 'Price is required';
    } else if (price < 0.01 || price > 999999.99) {
      newErrors.price = 'Price must be between 0.01 and 999,999.99';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.ageGroup) {
      newErrors.ageGroup = 'Age group is required';
    }

    if (!formData.difficultyLevel) {
      newErrors.difficultyLevel = 'Difficulty level is required';
    }

    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title must not exceed 60 characters';
    }

    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description must not exceed 160 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        ageGroup: formData.ageGroup,
        difficultyLevel: formData.difficultyLevel,
        stock: parseInt(formData.stock, 10) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 10,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        seoTitle: formData.seoTitle.trim() || undefined,
        seoDescription: formData.seoDescription.trim() || undefined,
        videoUrl: formData.videoUrl.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.details?.errors) {
          setErrors(data.details.errors as Record<string, string>);
        } else {
          setSubmitError(data.message || 'Failed to create product');
        }
        return;
      }

      router.push('/admin/products');
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, images, validate, router]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below to add a new product to the catalog.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                maxLength={200}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="e.g., Magical Unicorn Painting Kit"
              />
              <div className="mt-1 flex justify-between">
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                <p className="text-xs text-gray-400 ml-auto">{formData.name.length}/200</p>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                maxLength={5000}
                rows={5}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Describe the product, what's included, and key features..."
              />
              <div className="mt-1 flex justify-between">
                {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                <p className="text-xs text-gray-400 ml-auto">{formData.description.length}/5000</p>
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-gray-700">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                max="999999.99"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="299.00"
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-300' : 'border-gray-300'}`}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
            </div>

            {/* Age Group */}
            <div>
              <label htmlFor="ageGroup" className="mb-1.5 block text-sm font-medium text-gray-700">
                Age Group <span className="text-red-500">*</span>
              </label>
              <select
                id="ageGroup"
                value={formData.ageGroup}
                onChange={(e) => handleChange('ageGroup', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ageGroup ? 'border-red-300' : 'border-gray-300'}`}
              >
                <option value="">Select age group...</option>
                {AGE_GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.ageGroup && <p className="mt-1 text-xs text-red-600">{errors.ageGroup}</p>}
            </div>

            {/* Difficulty Level */}
            <div>
              <label htmlFor="difficultyLevel" className="mb-1.5 block text-sm font-medium text-gray-700">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                id="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={(e) => handleChange('difficultyLevel', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.difficultyLevel ? 'border-red-300' : 'border-gray-300'}`}
              >
                <option value="">Select difficulty...</option>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.difficultyLevel && <p className="mt-1 text-xs text-red-600">{errors.difficultyLevel}</p>}
            </div>
          </div>
        </section>

        {/* Inventory */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Inventory</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="stock" className="mb-1.5 block text-sm font-medium text-gray-700">
                Stock Quantity
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                max="999999"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">0 = Out of Stock on storefront</p>
            </div>
            <div>
              <label htmlFor="lowStockThreshold" className="mb-1.5 block text-sm font-medium text-gray-700">
                Low Stock Threshold
              </label>
              <input
                id="lowStockThreshold"
                type="number"
                min="1"
                max="999"
                value={formData.lowStockThreshold}
                onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Warning shown when stock ≤ this value (default: 10)</p>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Images</h2>
          <p className="mb-3 text-sm text-gray-500">
            Upload up to 10 images. Accepted formats: JPEG, PNG, WebP (max 5MB each). Drag and drop supported.
          </p>
          <ImageUploader
            maxFiles={10}
            maxSize={5 * 1024 * 1024}
            folder="products"
            label="Product Images"
            onUpload={handleImageUpload}
            onError={(err) => setErrors((prev) => ({ ...prev, images: err }))}
          />
          {errors.images && <p className="mt-2 text-xs text-red-600">{errors.images}</p>}

          {/* Image Preview List */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {images.map((img, index) => (
                <div key={index} className="group relative rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEO */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">SEO Metadata</h2>
          <div className="grid gap-6">
            <div>
              <label htmlFor="seoTitle" className="mb-1.5 block text-sm font-medium text-gray-700">
                Meta Title
              </label>
              <input
                id="seoTitle"
                type="text"
                value={formData.seoTitle}
                onChange={(e) => handleChange('seoTitle', e.target.value)}
                maxLength={60}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.seoTitle ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="SEO-optimized title (max 60 chars)"
              />
              <div className="mt-1 flex justify-between">
                {errors.seoTitle && <p className="text-xs text-red-600">{errors.seoTitle}</p>}
                <p className="text-xs text-gray-400 ml-auto">{formData.seoTitle.length}/60</p>
              </div>
            </div>
            <div>
              <label htmlFor="seoDescription" className="mb-1.5 block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => handleChange('seoDescription', e.target.value)}
                maxLength={160}
                rows={2}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.seoDescription ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Brief description for search engines (max 160 chars)"
              />
              <div className="mt-1 flex justify-between">
                {errors.seoDescription && <p className="text-xs text-red-600">{errors.seoDescription}</p>}
                <p className="text-xs text-gray-400 ml-auto">{formData.seoDescription.length}/160</p>
              </div>
            </div>
            <div>
              <label htmlFor="videoUrl" className="mb-1.5 block text-sm font-medium text-gray-700">
                Video URL
              </label>
              <input
                id="videoUrl"
                type="url"
                value={formData.videoUrl}
                onChange={(e) => handleChange('videoUrl', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
        </section>

        {/* Publishing */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Publishing</h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => handleChange('isPublished', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Published</span>
                <p className="text-xs text-gray-500">Product will be visible on the storefront</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => handleChange('isFeatured', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Featured</span>
                <p className="text-xs text-gray-500">Product will appear in featured sections</p>
              </div>
            </label>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
