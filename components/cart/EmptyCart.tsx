'use client';

/**
 * EmptyCart - Empty cart state with illustration and "Continue Shopping" link.
 * Requirements: 11.9
 */

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Cart illustration */}
      <div className="relative mb-8">
        <svg
          className="w-32 h-32 text-text-muted"
          fill="none"
          viewBox="0 0 128 128"
          aria-hidden="true"
        >
          <circle cx="64" cy="64" r="60" className="fill-surface-tertiary" />
          <path
            d="M40 44h8l6 32h28l6-24H50"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="56" cy="84" r="4" fill="currentColor" />
          <circle cx="76" cy="84" r="4" fill="currentColor" />
          {/* Paint splash decorations */}
          <circle cx="90" cy="35" r="5" className="fill-brand-highlight opacity-60" />
          <circle cx="32" cy="50" r="3" className="fill-paint-pink opacity-60" />
          <circle cx="95" cy="70" r="4" className="fill-brand-accent opacity-50" />
        </svg>
      </div>

      <h2 className="font-heading text-display-sm text-brand-dark mb-3">
        Your cart is empty
      </h2>
      <p className="text-text-secondary text-base mb-8 max-w-md">
        Looks like you haven&apos;t added any creative kits yet. Explore our
        collection and find the perfect painting activity!
      </p>

      <Link
        href="/shop"
        className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        Continue Shopping
      </Link>
    </motion.div>
  );
}
