'use client';

/**
 * AddressForm - Shipping address form with validation.
 * Fields: fullName, phone, line1, line2, city, state, postalCode, country
 * Supports guest checkout (email input) and registered user (pre-fill address).
 *
 * Requirements: 12.1, 12.2, 12.3
 */

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressFormProps {
  /** Whether this is guest checkout (show email input) */
  isGuest: boolean;
  /** Guest email value */
  guestEmail: string;
  /** Callback when guest email changes */
  onGuestEmailChange: (email: string) => void;
  /** Initial address (for pre-filling saved addresses) */
  initialAddress?: Partial<ShippingAddress>;
  /** Callback when form is submitted with valid data */
  onSubmit: (address: ShippingAddress) => void;
  /** Whether the form is currently being submitted */
  isSubmitting?: boolean;
}

interface FormErrors {
  guestEmail?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export default function AddressForm({
  isGuest,
  guestEmail,
  onGuestEmailChange,
  initialAddress,
  onSubmit,
  isSubmitting = false,
}: AddressFormProps) {
  const [address, setAddress] = useState<ShippingAddress>({
    ...EMPTY_ADDRESS,
    ...initialAddress,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Update address if initialAddress changes (e.g., user selects saved address)
  useEffect(() => {
    if (initialAddress) {
      setAddress((prev) => ({ ...prev, ...initialAddress }));
    }
  }, [initialAddress]);

  const validateField = useCallback(
    (field: string, value: string): string | undefined => {
      switch (field) {
        case 'guestEmail':
          if (!value.trim()) return 'Email is required for guest checkout';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
          return undefined;
        case 'fullName':
          if (!value.trim()) return 'Full name is required';
          if (value.length > 100) return 'Maximum 100 characters';
          return undefined;
        case 'phone':
          if (!value.trim()) return 'Phone number is required';
          if (!/^\+?[\d\s-]{7,15}$/.test(value.replace(/\s/g, '')))
            return 'Please enter a valid phone number (max 15 digits)';
          return undefined;
        case 'line1':
          if (!value.trim()) return 'Address line 1 is required';
          if (value.length > 200) return 'Maximum 200 characters';
          return undefined;
        case 'city':
          if (!value.trim()) return 'City is required';
          if (value.length > 100) return 'Maximum 100 characters';
          return undefined;
        case 'state':
          if (!value.trim()) return 'State is required';
          if (value.length > 100) return 'Maximum 100 characters';
          return undefined;
        case 'postalCode':
          if (!value.trim()) return 'Postal code is required';
          if (value.length > 10) return 'Maximum 10 characters';
          return undefined;
        case 'country':
          if (!value.trim()) return 'Country is required';
          return undefined;
        default:
          return undefined;
      }
    },
    []
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (isGuest) {
      const emailError = validateField('guestEmail', guestEmail);
      if (emailError) newErrors.guestEmail = emailError;
    }

    const fields: (keyof ShippingAddress)[] = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'];
    fields.forEach((field) => {
      const error = validateField(field, address[field]);
      if (error) (newErrors as Record<string, string>)[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [isGuest, guestEmail, address, validateField]);

  const handleChange = useCallback(
    (field: keyof ShippingAddress, value: string) => {
      setAddress((prev) => ({ ...prev, [field]: value }));
      if (touched.has(field)) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => new Set(prev).add(field));
      const value = field === 'guestEmail' ? guestEmail : address[field as keyof ShippingAddress];
      const error = validateField(field, value || '');
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [address, guestEmail, validateField]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Touch all fields
      const allFields = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'];
      if (isGuest) allFields.push('guestEmail');
      setTouched(new Set(allFields));

      if (validateAll()) {
        onSubmit(address);
      }
    },
    [address, isGuest, onSubmit, validateAll]
  );

  const inputClasses = (hasError?: string) =>
    `w-full px-4 py-3 rounded-xl border-2 transition-colors font-body text-sm
     focus:outline-none focus:ring-0
     ${hasError
        ? 'border-status-error bg-red-50 focus:border-status-error'
        : 'border-surface-tertiary bg-white focus:border-brand-primary'
     }`;

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      <h2 className="font-heading text-xl font-semibold text-brand-dark">
        Shipping Address
      </h2>

      {/* Guest email input */}
      {isGuest && (
        <div>
          <label htmlFor="guestEmail" className="block text-sm font-medium text-text-primary mb-1.5">
            Email Address <span className="text-status-error">*</span>
          </label>
          <input
            id="guestEmail"
            type="email"
            value={guestEmail}
            onChange={(e) => onGuestEmailChange(e.target.value)}
            onBlur={() => handleBlur('guestEmail')}
            placeholder="your@email.com"
            className={inputClasses(errors.guestEmail)}
            aria-invalid={!!errors.guestEmail}
            aria-describedby={errors.guestEmail ? 'guestEmail-error' : undefined}
          />
          {errors.guestEmail && (
            <p id="guestEmail-error" className="mt-1 text-xs text-status-error">
              {errors.guestEmail}
            </p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            We&apos;ll send order confirmation and tracking info to this email.
          </p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-1.5">
          Full Name <span className="text-status-error">*</span>
        </label>
        <input
          id="fullName"
          type="text"
          value={address.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          onBlur={() => handleBlur('fullName')}
          placeholder="John Doe"
          maxLength={100}
          className={inputClasses(errors.fullName)}
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1 text-xs text-status-error">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1.5">
          Phone Number <span className="text-status-error">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={address.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          placeholder="+91 98765 43210"
          maxLength={15}
          className={inputClasses(errors.phone)}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-xs text-status-error">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="line1" className="block text-sm font-medium text-text-primary mb-1.5">
          Address Line 1 <span className="text-status-error">*</span>
        </label>
        <input
          id="line1"
          type="text"
          value={address.line1}
          onChange={(e) => handleChange('line1', e.target.value)}
          onBlur={() => handleBlur('line1')}
          placeholder="House/Flat No., Street, Area"
          maxLength={200}
          className={inputClasses(errors.line1)}
          aria-invalid={!!errors.line1}
          aria-describedby={errors.line1 ? 'line1-error' : undefined}
        />
        {errors.line1 && (
          <p id="line1-error" className="mt-1 text-xs text-status-error">
            {errors.line1}
          </p>
        )}
      </div>

      {/* Address Line 2 (optional) */}
      <div>
        <label htmlFor="line2" className="block text-sm font-medium text-text-primary mb-1.5">
          Address Line 2 <span className="text-text-muted">(optional)</span>
        </label>
        <input
          id="line2"
          type="text"
          value={address.line2}
          onChange={(e) => handleChange('line2', e.target.value)}
          placeholder="Landmark, Apartment name"
          maxLength={200}
          className={inputClasses()}
        />
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-text-primary mb-1.5">
            City <span className="text-status-error">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={address.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            placeholder="Mumbai"
            maxLength={100}
            className={inputClasses(errors.city)}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="mt-1 text-xs text-status-error">
              {errors.city}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-text-primary mb-1.5">
            State <span className="text-status-error">*</span>
          </label>
          <input
            id="state"
            type="text"
            value={address.state}
            onChange={(e) => handleChange('state', e.target.value)}
            onBlur={() => handleBlur('state')}
            placeholder="Maharashtra"
            maxLength={100}
            className={inputClasses(errors.state)}
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? 'state-error' : undefined}
          />
          {errors.state && (
            <p id="state-error" className="mt-1 text-xs text-status-error">
              {errors.state}
            </p>
          )}
        </div>
      </div>

      {/* Postal Code and Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-text-primary mb-1.5">
            Postal Code <span className="text-status-error">*</span>
          </label>
          <input
            id="postalCode"
            type="text"
            value={address.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            onBlur={() => handleBlur('postalCode')}
            placeholder="400001"
            maxLength={10}
            className={inputClasses(errors.postalCode)}
            aria-invalid={!!errors.postalCode}
            aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
          />
          {errors.postalCode && (
            <p id="postalCode-error" className="mt-1 text-xs text-status-error">
              {errors.postalCode}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-text-primary mb-1.5">
            Country <span className="text-status-error">*</span>
          </label>
          <select
            id="country"
            value={address.country}
            onChange={(e) => handleChange('country', e.target.value)}
            onBlur={() => handleBlur('country')}
            className={inputClasses(errors.country)}
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? 'country-error' : undefined}
          >
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
            <option value="Singapore">Singapore</option>
          </select>
          {errors.country && (
            <p id="country-error" className="mt-1 text-xs text-status-error">
              {errors.country}
            </p>
          )}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-3.5 text-base mt-4"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : (
          'Continue to Payment'
        )}
      </button>
    </motion.form>
  );
}
