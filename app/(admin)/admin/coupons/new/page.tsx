'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CouponFormData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minOrderAmount: string;
  expiryDate: string;
  maxUsage: string;
  isActive: boolean;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Page Component ────────────────────────────────────────────────────────────

/**
 * Admin Create Coupon Page
 *
 * Form fields:
 * - Code: 3-20 alphanumeric characters (auto-uppercase)
 * - Discount Type: percentage or fixed
 * - Discount Value: 1-99% for percentage, 0.01-999,999.99 for fixed
 * - Min Order Amount: 0-999,999.99
 * - Expiry Date: must be a future date
 * - Usage Limit: 1-1,000,000
 * - Active status toggle
 *
 * Requirements: 19.1, 19.4, 19.5
 */
export default function AdminCreateCouponPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    expiryDate: '',
    maxUsage: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Code validation: 3-20 alphanumeric
    const code = formData.code.trim().toUpperCase();
    if (!code) {
      newErrors.code = 'Coupon code is required';
    } else if (code.length < 3 || code.length > 20) {
      newErrors.code = 'Code must be between 3 and 20 characters';
    } else if (!/^[A-Z0-9]+$/.test(code)) {
      newErrors.code = 'Code must contain only letters and numbers';
    }

    // Discount value validation
    const discountValue = Number(formData.discountValue);
    if (!formData.discountValue) {
      newErrors.discountValue = 'Discount value is required';
    } else if (isNaN(discountValue)) {
      newErrors.discountValue = 'Must be a valid number';
    } else if (formData.discountType === 'PERCENTAGE') {
      if (discountValue < 1 || discountValue > 99) {
        newErrors.discountValue = 'Percentage must be between 1 and 99';
      }
    } else {
      if (discountValue < 0.01 || discountValue > 999999.99) {
        newErrors.discountValue = 'Amount must be between ₹0.01 and ₹999,999.99';
      }
    }

    // Min order amount validation (optional)
    if (formData.minOrderAmount) {
      const minAmount = Number(formData.minOrderAmount);
      if (isNaN(minAmount) || minAmount < 0 || minAmount > 999999.99) {
        newErrors.minOrderAmount = 'Must be between 0 and 999,999.99';
      }
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const expiry = new Date(formData.expiryDate);
      if (isNaN(expiry.getTime())) {
        newErrors.expiryDate = 'Invalid date';
      } else if (expiry <= new Date()) {
        newErrors.expiryDate = 'Must be a future date';
      }
    }

    // Usage limit validation
    const maxUsage = Number(formData.maxUsage);
    if (!formData.maxUsage) {
      newErrors.maxUsage = 'Usage limit is required';
    } else if (isNaN(maxUsage) || !Number.isInteger(maxUsage) || maxUsage < 1 || maxUsage > 1000000) {
      newErrors.maxUsage = 'Must be between 1 and 1,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
          expiryDate: new Date(formData.expiryDate).toISOString(),
          maxUsage: Number(formData.maxUsage),
          isActive: formData.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.details?.errors) {
          setErrors(data.details.errors as FormErrors);
        } else {
          setApiError(data.message || 'Failed to create coupon');
        }
        return;
      }

      router.push('/admin/coupons');
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
      console.error('Error creating coupon:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CouponFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Get minimum date for expiry (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/coupons"
          className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Coupons
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Coupon</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new discount coupon for promotions
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Coupon Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Coupon Code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            placeholder="e.g., SUMMER20"
            maxLength={20}
            className={`mt-1 block w-full rounded-lg border px-4 py-2.5 font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 ${
              errors.code
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            3-20 alphanumeric characters. Will be stored in uppercase.
          </p>
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
          )}
        </div>

        {/* Discount Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Discount Type <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                value="PERCENTAGE"
                checked={formData.discountType === 'PERCENTAGE'}
                onChange={(e) => handleChange('discountType', e.target.value)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Percentage (%)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                value="FIXED"
                checked={formData.discountType === 'FIXED'}
                onChange={(e) => handleChange('discountType', e.target.value)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Fixed Amount (₹)</span>
            </label>
          </div>
        </div>

        {/* Discount Value */}
        <div>
          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
            Discount Value <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
              {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
            </span>
            <input
              id="discountValue"
              type="number"
              step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
              min={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
              max={formData.discountType === 'PERCENTAGE' ? '99' : '999999.99'}
              value={formData.discountValue}
              onChange={(e) => handleChange('discountValue', e.target.value)}
              placeholder={formData.discountType === 'PERCENTAGE' ? '1-99' : '0.01-999,999.99'}
              className={`block w-full rounded-lg border py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 ${
                errors.discountValue
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formData.discountType === 'PERCENTAGE'
              ? 'Enter a percentage between 1 and 99'
              : 'Enter an amount between ₹0.01 and ₹999,999.99'}
          </p>
          {errors.discountValue && (
            <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
          )}
        </div>

        {/* Min Order Amount */}
        <div>
          <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700">
            Minimum Order Amount
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
              ₹
            </span>
            <input
              id="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              max="999999.99"
              value={formData.minOrderAmount}
              onChange={(e) => handleChange('minOrderAmount', e.target.value)}
              placeholder="0.00 (no minimum)"
              className={`block w-full rounded-lg border py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 ${
                errors.minOrderAmount
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Leave empty or set to 0 for no minimum requirement
          </p>
          {errors.minOrderAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.minOrderAmount}</p>
          )}
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            id="expiryDate"
            type="date"
            min={getMinDate()}
            value={formData.expiryDate}
            onChange={(e) => handleChange('expiryDate', e.target.value)}
            className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              errors.expiryDate
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be a future date. Coupon becomes invalid after this date.
          </p>
          {errors.expiryDate && (
            <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
          )}
        </div>

        {/* Usage Limit */}
        <div>
          <label htmlFor="maxUsage" className="block text-sm font-medium text-gray-700">
            Usage Limit <span className="text-red-500">*</span>
          </label>
          <input
            id="maxUsage"
            type="number"
            step="1"
            min="1"
            max="1000000"
            value={formData.maxUsage}
            onChange={(e) => handleChange('maxUsage', e.target.value)}
            placeholder="e.g., 100"
            className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              errors.maxUsage
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum number of times this coupon can be used (1–1,000,000). Coupon auto-deactivates when limit is reached.
          </p>
          {errors.maxUsage && (
            <p className="mt-1 text-sm text-red-600">{errors.maxUsage}</p>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleChange('isActive', !formData.isActive)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ backgroundColor: formData.isActive ? '#10b981' : '#d1d5db' }}
            role="switch"
            aria-checked={formData.isActive}
            aria-label="Activate coupon immediately"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {formData.isActive ? 'Active — coupon is usable immediately' : 'Inactive — coupon cannot be used until activated'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Coupon'}
          </button>
          <Link
            href="/admin/coupons"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
