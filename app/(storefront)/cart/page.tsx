'use client';

/**
 * Full Cart Page - Displays all cart items with quantity controls, remove buttons,
 * coupon input, gift note, shipping estimate, and order summary.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import CartItem, { type CartItemData } from '@/components/cart/CartItem';
import CouponInput from '@/components/cart/CouponInput';
import GiftNote from '@/components/cart/GiftNote';
import CartSummary from '@/components/cart/CartSummary';
import ShippingEstimate from '@/components/cart/ShippingEstimate';
import EmptyCart from '@/components/cart/EmptyCart';

interface CartState {
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [giftNote, setGiftNote] = useState('');
  const [shippingEstimated, setShippingEstimated] = useState(false);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch {
      // Silently handle error — show empty cart
      setCart({ items: [], itemCount: 0, subtotal: 0, discount: 0, shipping: 0, total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity (recalculates within 2 seconds without page reload)
  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch {
      // Silently handle — keep current state
    }
  }, []);

  // Remove item
  const handleRemoveItem = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch {
      // Silently handle
    }
  }, []);

  // Apply coupon
  const handleApplyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/cart/coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Update cart discount and total
          const discountAmount = data.discount || 0;
          setCart((prev) =>
            prev
              ? {
                  ...prev,
                  discount: discountAmount,
                  total: prev.subtotal - discountAmount + prev.shipping,
                }
              : prev
          );
          setAppliedCoupon({
            code: data.code || code,
            discountAmount,
          });
          return { success: true };
        } else {
          return {
            success: false,
            error: data.message || data.reason || 'Invalid coupon code',
          };
        }
      } catch {
        return { success: false, error: 'Failed to apply coupon. Please try again.' };
      }
    },
    []
  );

  // Remove coupon
  const handleRemoveCoupon = useCallback(async () => {
    try {
      if (appliedCoupon) {
        await fetch(`/api/cart/coupon?code=${appliedCoupon.code}`, {
          method: 'DELETE',
        });
      }
    } catch {
      // Silently handle
    }
    // Reset discount in cart state
    setCart((prev) =>
      prev ? { ...prev, discount: 0, total: prev.subtotal + prev.shipping } : prev
    );
    setAppliedCoupon(null);
  }, [appliedCoupon]);

  // Shipping estimate
  const handleShippingEstimate = useCallback(
    async (postalCode: string): Promise<{ cost: number; message: string } | null> => {
      try {
        const res = await fetch('/api/cart/shipping-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postalCode }),
        });

        if (res.ok) {
          const data = await res.json();
          // Update cart shipping cost
          if (cart) {
            setCart((prev) =>
              prev ? { ...prev, shipping: data.cost, total: prev.subtotal - prev.discount + data.cost } : prev
            );
          }
          setShippingEstimated(true);
          return {
            cost: data.cost,
            message: data.cost === 0
              ? 'Free shipping to your location!'
              : `Estimated shipping: ₹${data.cost.toLocaleString('en-IN')}`,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    [cart]
  );

  // Handle gift note change
  const handleGiftNoteChange = useCallback((note: string) => {
    setGiftNote(note);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface-tertiary rounded-xl" />
          <div className="h-24 bg-surface-tertiary rounded-xl" />
          <div className="h-24 bg-surface-tertiary rounded-xl" />
          <div className="h-24 bg-surface-tertiary rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty cart state — hide coupon, gift note, and checkout (Requirement 11.9)
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-display-sm text-brand-dark">Shopping Cart</h1>
        <Link
          href="/shop"
          className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main cart area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart items */}
          <div className="rounded-2xl border-2 border-surface-tertiary bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-brand-dark">
                Cart Items ({cart.itemCount})
              </h2>
            </div>

            <AnimatePresence mode="popLayout">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Coupon, Gift Note, Shipping — visible only when cart has items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coupon input */}
            <div className="rounded-2xl border-2 border-surface-tertiary bg-white p-4 sm:p-6">
              <CouponInput
                appliedCoupon={appliedCoupon}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
              />
            </div>

            {/* Gift note */}
            <div className="rounded-2xl border-2 border-surface-tertiary bg-white p-4 sm:p-6">
              <GiftNote value={giftNote} onChange={handleGiftNoteChange} />
            </div>
          </div>

          {/* Shipping estimate */}
          <div className="rounded-2xl border-2 border-surface-tertiary bg-white p-4 sm:p-6">
            <ShippingEstimate
              onEstimate={handleShippingEstimate}
              currentEstimate={cart.shipping}
            />
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={cart.subtotal}
            discount={cart.discount}
            shipping={cart.shipping}
            total={cart.total}
            shippingEstimated={shippingEstimated}
            itemCount={cart.itemCount}
          />
        </div>
      </div>
    </div>
  );
}
