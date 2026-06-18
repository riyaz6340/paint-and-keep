'use client';

/**
 * Checkout Page - Multi-step checkout flow (Address → Payment → Confirmation).
 * Supports guest checkout (email input) and registered user checkout (pre-fill address).
 * Shows order summary sidebar, validates fields, handles payment processing with
 * loading states, and shows order confirmation on success.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.8, 12.9
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import CheckoutSteps, { type CheckoutStep } from '@/components/checkout/CheckoutSteps';
import AddressForm, { type ShippingAddress } from '@/components/checkout/AddressForm';
import PaymentMethodSelector, { type PaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import OrderSummary, { type OrderSummaryItem } from '@/components/checkout/OrderSummary';
import OrderConfirmation, { type ConfirmedOrderItem } from '@/components/checkout/OrderConfirmation';
import Link from 'next/link';

interface CartData {
  items: OrderSummaryItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface OrderResult {
  orderNumber: string;
  items: ConfirmedOrderItem[];
  total: number;
  estimatedDelivery: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  // Checkout flow state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  // Address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [savedAddress, setSavedAddress] = useState<Partial<ShippingAddress> | undefined>(undefined);

  // Payment state
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Confirmation state
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Fetch cart data on mount
  useEffect(() => {
    fetchCart();
  }, []);

  // Fetch saved address for authenticated users, or pre-fill from profile
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchSavedAddress();
    }
  }, [isAuthenticated, authLoading]);

  // Pre-fill name/phone from user profile if no saved address
  useEffect(() => {
    if (user && !savedAddress) {
      setSavedAddress({
        fullName: user.name || '',
        phone: user.phone || '',
        country: 'India',
      });
    }
  }, [user, savedAddress]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart({
          items: data.items || [],
          subtotal: data.subtotal || 0,
          discount: data.discount || 0,
          shipping: data.shipping || 0,
          total: data.total || 0,
        });
      }
    } catch {
      // Cart fetch failed
    } finally {
      setIsLoadingCart(false);
    }
  };

  const fetchSavedAddress = async () => {
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) {
        const data = await res.json();
        // Use default address or first address
        const addresses = data.addresses || data || [];
        const defaultAddress = addresses.find((a: { isDefault?: boolean }) => a.isDefault) || addresses[0];
        if (defaultAddress) {
          setSavedAddress({
            fullName: defaultAddress.fullName || '',
            phone: defaultAddress.phone || '',
            line1: defaultAddress.line1 || '',
            line2: defaultAddress.line2 || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            postalCode: defaultAddress.postalCode || '',
            country: defaultAddress.country || 'India',
          });
        }
      }
    } catch {
      // Silently handle — user can enter address manually
    }
  };

  // Handle address submission
  const handleAddressSubmit = useCallback((address: ShippingAddress) => {
    setShippingAddress(address);
    setCurrentStep('payment');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle payment confirmation
  const handlePaymentConfirm = useCallback(async () => {
    if (!selectedPayment || !shippingAddress || !cart) return;

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const checkoutPayload = {
        shippingAddress,
        paymentMethod: selectedPayment,
        ...((!isAuthenticated) && { guestEmail }),
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await res.json();

      if (res.ok && data.orderId) {
        // Payment session created — simulate redirect and callback
        // In production, this would redirect to Razorpay/Stripe
        // For now, we handle the success flow
        if (data.redirectUrl) {
          // Redirect to payment gateway
          window.location.href = data.redirectUrl;
          return;
        }

        // Direct success (e.g., COD or test mode)
        setOrderResult({
          orderNumber: data.orderNumber || data.orderId,
          items: cart.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          total: cart.total,
          estimatedDelivery: data.estimatedDelivery || getEstimatedDelivery(),
        });
        setCurrentStep('confirmation');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Payment failed
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        setPaymentError(
          data.message || data.error || 'Payment failed. Please try again.'
        );
      }
    } catch {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setPaymentError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [selectedPayment, shippingAddress, cart, isAuthenticated, guestEmail, retryCount]);

  // Handle going back to address step
  const handleBackToAddress = useCallback(() => {
    setCurrentStep('address');
    setPaymentError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get estimated delivery date (5-7 business days from now)
  function getEstimatedDelivery(): string {
    const today = new Date();
    const delivery = new Date(today);
    delivery.setDate(today.getDate() + 7);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return delivery.toLocaleDateString('en-IN', options);
  }

  // Loading state
  if (isLoadingCart || authLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface-tertiary rounded-xl" />
          <div className="flex gap-4 justify-center mb-8">
            <div className="h-10 w-10 bg-surface-tertiary rounded-full" />
            <div className="h-10 w-10 bg-surface-tertiary rounded-full" />
            <div className="h-10 w-10 bg-surface-tertiary rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-12 bg-surface-tertiary rounded-xl" />
              <div className="h-12 bg-surface-tertiary rounded-xl" />
              <div className="h-12 bg-surface-tertiary rounded-xl" />
              <div className="h-12 bg-surface-tertiary rounded-xl" />
            </div>
            <div className="h-64 bg-surface-tertiary rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart — redirect back to cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-tertiary flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="font-heading text-display-sm text-brand-dark mb-2">Your cart is empty</h1>
          <p className="text-text-secondary mb-6">
            Add some creative kits to your cart before checking out.
          </p>
          <Link href="/shop" className="btn-primary py-3 px-8">
            Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  // Confirmation step — full width
  if (currentStep === 'confirmation' && orderResult) {
    return (
      <div className="container-page py-8 sm:py-12">
        <CheckoutSteps currentStep="confirmation" />
        <OrderConfirmation
          orderNumber={orderResult.orderNumber}
          items={orderResult.items}
          total={orderResult.total}
          estimatedDelivery={orderResult.estimatedDelivery}
          email={isAuthenticated ? (user?.email || '') : guestEmail}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Page title */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-display-sm text-brand-dark">Checkout</h1>
        <Link
          href="/cart"
          className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Cart
        </Link>
      </div>

      {/* Step indicator */}
      <CheckoutSteps currentStep={currentStep} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form area */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border-2 border-surface-tertiary bg-white p-5 sm:p-8">
            {/* Address step */}
            {currentStep === 'address' && (
              <AddressForm
                isGuest={!isAuthenticated}
                guestEmail={guestEmail}
                onGuestEmailChange={setGuestEmail}
                initialAddress={savedAddress}
                onSubmit={handleAddressSubmit}
              />
            )}

            {/* Payment step */}
            {currentStep === 'payment' && (
              <PaymentMethodSelector
                selectedMethod={selectedPayment}
                onSelect={setSelectedPayment}
                onConfirm={handlePaymentConfirm}
                onBack={handleBackToAddress}
                isProcessing={isProcessingPayment}
                error={paymentError}
                retriesRemaining={MAX_RETRIES - retryCount}
              />
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={cart.items}
            subtotal={cart.subtotal}
            discount={cart.discount}
            shipping={cart.shipping}
            total={cart.total}
          />
        </div>
      </div>
    </div>
  );
}
