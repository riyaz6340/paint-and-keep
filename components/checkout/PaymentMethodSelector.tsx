'use client';

/**
 * PaymentMethodSelector - Payment method selection (Razorpay / Stripe) with logos.
 *
 * Requirements: 12.4
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

export type PaymentMethod = 'razorpay' | 'stripe';

interface PaymentMethodSelectorProps {
  /** Currently selected method */
  selectedMethod: PaymentMethod | null;
  /** Callback when a method is selected */
  onSelect: (method: PaymentMethod) => void;
  /** Callback to proceed with payment */
  onConfirm: () => void;
  /** Callback to go back to address step */
  onBack: () => void;
  /** Whether payment is being processed */
  isProcessing: boolean;
  /** Payment error message (if any) */
  error?: string | null;
  /** Number of retry attempts remaining */
  retriesRemaining?: number;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  onConfirm,
  onBack,
  isProcessing,
  error,
  retriesRemaining = 3,
}: PaymentMethodSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="font-heading text-xl font-semibold text-brand-dark">
        Payment Method
      </h2>

      <p className="text-sm text-text-secondary">
        Choose your preferred payment method to complete the order.
      </p>

      {/* Payment options */}
      <div className="space-y-3">
        {/* Razorpay */}
        <button
          type="button"
          onClick={() => onSelect('razorpay')}
          disabled={isProcessing}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
            selectedMethod === 'razorpay'
              ? 'border-brand-primary bg-orange-50 shadow-sm'
              : 'border-surface-tertiary bg-white hover:border-brand-primary/50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-pressed={selectedMethod === 'razorpay'}
        >
          {/* Radio indicator */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selectedMethod === 'razorpay'
                ? 'border-brand-primary'
                : 'border-text-muted'
            }`}
          >
            {selectedMethod === 'razorpay' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2.5 h-2.5 rounded-full bg-brand-primary"
              />
            )}
          </div>

          {/* Razorpay Logo (text representation) */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-brand-dark text-sm">Razorpay</p>
              <p className="text-xs text-text-secondary">UPI, Cards, Net Banking, Wallets</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs bg-surface-tertiary text-text-secondary px-2 py-0.5 rounded-full">UPI</span>
            <span className="text-xs bg-surface-tertiary text-text-secondary px-2 py-0.5 rounded-full">Cards</span>
          </div>
        </button>

        {/* Stripe */}
        <button
          type="button"
          onClick={() => onSelect('stripe')}
          disabled={isProcessing}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
            selectedMethod === 'stripe'
              ? 'border-brand-primary bg-orange-50 shadow-sm'
              : 'border-surface-tertiary bg-white hover:border-brand-primary/50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-pressed={selectedMethod === 'stripe'}
        >
          {/* Radio indicator */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selectedMethod === 'stripe'
                ? 'border-brand-primary'
                : 'border-text-muted'
            }`}
          >
            {selectedMethod === 'stripe' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2.5 h-2.5 rounded-full bg-brand-primary"
              />
            )}
          </div>

          {/* Stripe Logo (text representation) */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-brand-dark text-sm">Stripe</p>
              <p className="text-xs text-text-secondary">International Cards, Apple Pay, Google Pay</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs bg-surface-tertiary text-text-secondary px-2 py-0.5 rounded-full">Visa</span>
            <span className="text-xs bg-surface-tertiary text-text-secondary px-2 py-0.5 rounded-full">Mastercard</span>
          </div>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-status-error/20"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-status-error shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-status-error">{error}</p>
              {retriesRemaining > 0 && (
                <p className="text-xs text-text-secondary mt-1">
                  You have {retriesRemaining} {retriesRemaining === 1 ? 'attempt' : 'attempts'} remaining.
                  You can retry or choose another payment method.
                </p>
              )}
              {retriesRemaining === 0 && (
                <p className="text-xs text-text-secondary mt-1">
                  Maximum retry attempts reached. Please try again later or contact support.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="btn-outline py-3 px-6 flex-1 sm:flex-none"
        >
          ← Back to Address
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedMethod || isProcessing || retriesRemaining === 0}
          className="btn-primary py-3.5 flex-1 text-base"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing Payment...
            </span>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted pt-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Your payment information is encrypted and secure</span>
      </div>
    </motion.div>
  );
}
