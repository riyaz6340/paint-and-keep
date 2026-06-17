'use client';

/**
 * CartMini - Mini cart overlay/dropdown accessible from any page.
 * Shows item count badge on cart icon, subtotal, quick view of items, and link to full cart.
 * Requirements: 11.1, 11.10
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItemData } from './CartItem';

interface CartMiniProps {
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
  onRemoveItem: (productId: string) => Promise<void>;
}

export default function CartMini({ items, itemCount, subtotal, onRemoveItem }: CartMiniProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCart = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Cart icon button with badge */}
      <button
        type="button"
        onClick={toggleCart}
        className="relative p-2 text-brand-dark hover:text-brand-primary transition-colors"
        aria-label={`Shopping cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>

        {/* Item count badge */}
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center
                       w-5 h-5 rounded-full bg-brand-primary text-white text-xs font-bold"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50
                       rounded-2xl bg-white border border-surface-tertiary shadow-card-hover
                       overflow-hidden"
            role="dialog"
            aria-label="Shopping cart preview"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-tertiary bg-surface-secondary">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-brand-dark text-sm">
                  Shopping Cart ({itemCount})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-text-muted hover:text-brand-dark transition-colors"
                  aria-label="Close cart preview"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="max-h-72 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-text-muted">Your cart is empty</p>
                </div>
              ) : (
                <ul className="divide-y divide-surface-tertiary">
                  {items.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Item image */}
                      <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-surface-secondary">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24">
                              <path stroke="currentColor" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-brand-dark line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Item subtotal & remove */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-dark">
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.productId)}
                          className="p-1 text-text-muted hover:text-status-error transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                  {items.length > 5 && (
                    <li className="px-4 py-2 text-center">
                      <span className="text-xs text-text-muted">
                        +{items.length - 5} more {items.length - 5 === 1 ? 'item' : 'items'}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Footer with subtotal and links */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-surface-tertiary bg-surface-secondary">
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-text-secondary">Subtotal</span>
                  <span className="text-sm font-bold text-brand-dark">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl border-2 border-brand-dark text-brand-dark
                               text-sm font-semibold hover:bg-brand-dark hover:text-white transition-colors"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl bg-brand-primary text-white
                               text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
