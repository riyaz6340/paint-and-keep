'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch cart count and auth status on mount
  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch('/api/cart');
        if (res.ok) {
          const data = await res.json();
          setCartCount(data.itemCount || 0);
        }
      } catch {
        // silently fail
      }
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    }

    fetchCart();
    checkAuth();

    const interval = setInterval(fetchCart, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-surface-tertiary">
      <div className="container-page flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <span className="font-heading font-bold text-xl text-brand-dark">Paint & Keep</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <Link href="/shop" className="text-sm font-medium text-text-secondary hover:text-brand-primary transition-colors">
            Shop
          </Link>
          <Link href="/birthday-packages" className="text-sm font-medium text-text-secondary hover:text-brand-primary transition-colors">
            Birthday Packages
          </Link>
          <Link href="/gallery" className="text-sm font-medium text-text-secondary hover:text-brand-primary transition-colors">
            Gallery
          </Link>
          <Link href="/about" className="text-sm font-medium text-text-secondary hover:text-brand-primary transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-brand-primary transition-colors">
            Contact
          </Link>
        </nav>

        {/* Right side: Cart + Account */}
        <div className="flex items-center gap-4">
          {/* Cart icon */}
          <Link
            href="/cart"
            className="relative p-2 text-brand-dark hover:text-brand-primary transition-colors"
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Account link */}
          {isLoggedIn ? (
            <Link
              href="/account"
              className="hidden md:block p-2 text-brand-dark hover:text-brand-primary transition-colors"
              aria-label="Account"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary/90 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-brand-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-surface-tertiary bg-white px-4 py-4 space-y-3" aria-label="Mobile navigation">
          <Link href="/shop" className="block text-sm font-medium text-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/birthday-packages" className="block text-sm font-medium text-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Birthday Packages</Link>
          <Link href="/gallery" className="block text-sm font-medium text-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
          <Link href="/about" className="block text-sm font-medium text-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className="block text-sm font-medium text-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          {isLoggedIn ? (
            <Link href="/account" className="block text-sm font-medium text-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
          ) : (
            <>
              <Link href="/login" className="block text-sm font-medium text-brand-primary py-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link href="/register" className="block text-sm font-medium text-brand-primary py-2" onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
