'use client';

/**
 * CartItem - Individual cart item row with image, name, price, quantity controls, and remove button.
 * Requirements: 11.2, 11.3, 11.10
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import QuantitySelector from '@/components/product/QuantitySelector';

export interface CartItemData {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string | null;
  subtotal: number;
}

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = useCallback(
    async (quantity: number) => {
      setIsUpdating(true);
      try {
        await onUpdateQuantity(item.productId, quantity);
      } finally {
        setIsUpdating(false);
      }
    },
    [item.productId, onUpdateQuantity]
  );

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.productId);
    } finally {
      setIsRemoving(false);
    }
  }, [item.productId, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isRemoving ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 py-4 border-b border-surface-tertiary last:border-b-0"
    >
      {/* Product image */}
      <Link
        href={`/shop/${item.slug}`}
        className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-surface-secondary"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24">
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
      </Link>

      {/* Item details */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/shop/${item.slug}`}
            className="font-semibold text-brand-dark text-sm sm:text-base line-clamp-2 hover:text-brand-primary transition-colors"
          >
            {item.name}
          </Link>
          <p className="text-sm text-text-secondary mt-1">
            ₹{item.price.toLocaleString('en-IN')} each
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-3">
          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            disabled={isUpdating}
          />
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-[80px]">
          <p className="font-bold text-brand-dark text-base">
            ₹{item.subtotal.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className="self-start sm:self-center p-2 text-text-muted hover:text-status-error transition-colors disabled:opacity-50"
          aria-label={`Remove ${item.name} from cart`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
