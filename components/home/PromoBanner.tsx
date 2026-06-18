'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PromoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative">
      {/* Tier 1: Trust/certification bar */}
      <div className="bg-brand-dark text-white">
        <div className="container-page flex items-center justify-center gap-4 py-1.5 text-xs font-medium">
          <span className="flex items-center gap-1">
            ✅ 100% Non-Toxic & Child-Safe Paints
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:flex items-center gap-1">
            🌱 Eco-Friendly Packaging
          </span>
          <span className="hidden md:inline text-white/40">|</span>
          <span className="hidden md:flex items-center gap-1">
            ⭐ Trusted by 500+ Families
          </span>
        </div>
      </div>
      {/* Tier 2: Promo offer */}
      <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white">
        <div className="container-page flex items-center justify-center gap-2 py-2 text-center text-sm font-medium">
          <span>🎉</span>
          <p>
            <strong>Free Shipping</strong> on orders above ₹999 &bull; Use code{' '}
            <Link href="/shop" className="underline font-bold">WELCOME10</Link>{' '}
            for 10% off your first order!
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white"
          aria-label="Dismiss banner"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
