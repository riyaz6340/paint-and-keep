'use client';

/**
 * OrderConfirmation - Success page showing order number, items,
 * and estimated delivery date after successful payment.
 *
 * Requirements: 12.6
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface ConfirmedOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface OrderConfirmationProps {
  orderNumber: string;
  items: ConfirmedOrderItem[];
  total: number;
  estimatedDelivery: string;
  email: string;
}

export default function OrderConfirmation({
  orderNumber,
  items,
  total,
  estimatedDelivery,
  email,
}: OrderConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-2xl mx-auto text-center"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-status-success/10 flex items-center justify-center"
      >
        <svg className="w-10 h-10 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      {/* Heading */}
      <h1 className="font-heading text-display-sm text-brand-dark mb-2">
        Order Confirmed! 🎨
      </h1>
      <p className="text-text-secondary mb-2">
        Thank you for your order! Your creative kit is on its way.
      </p>

      {/* Order number */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-tertiary mb-8">
        <span className="text-sm text-text-secondary">Order #</span>
        <span className="text-sm font-bold text-brand-dark">{orderNumber}</span>
      </div>

      {/* Order details card */}
      <div className="rounded-2xl border-2 border-surface-tertiary bg-white p-6 text-left mb-6">
        {/* Delivery estimate */}
        <div className="flex items-center gap-3 pb-4 border-b border-surface-tertiary mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-dark">Estimated Delivery</p>
            <p className="text-sm text-text-secondary">{estimatedDelivery}</p>
          </div>
        </div>

        {/* Items */}
        <h3 className="font-heading text-sm font-semibold text-brand-dark mb-3">
          Items Ordered
        </h3>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-tertiary shrink-0">
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
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-dark line-clamp-1">{item.name}</p>
                <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-brand-dark">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-surface-tertiary pt-3">
          <div className="flex justify-between items-center">
            <span className="font-heading font-bold text-brand-dark">Total Paid</span>
            <span className="font-heading font-bold text-brand-dark text-lg">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation email notice */}
      <p className="text-sm text-text-secondary mb-8">
        A confirmation email has been sent to{' '}
        <span className="font-medium text-brand-dark">{email}</span>
      </p>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account/orders" className="btn-primary py-3 px-6">
          Track Your Order
        </Link>
        <Link href="/shop" className="btn-outline py-3 px-6">
          Continue Shopping
        </Link>
      </div>
    </motion.div>
  );
}
