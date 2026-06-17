/**
 * Paint & Keep - Coupon Service
 *
 * Provides coupon validation, application, and removal logic.
 * Handles discount calculation for both PERCENTAGE and FIXED types.
 *
 * Validation checks:
 * - Code exists in database
 * - Coupon is active
 * - Not expired
 * - Cart subtotal meets minOrderAmount
 * - currentUsage < maxUsage
 *
 * Auto-deactivates coupon when maxUsage is reached.
 *
 * Requirements: 11.4, 11.5, 11.6, 19.2, 19.3, 19.6
 */

import prisma from '@/lib/prisma';
import type { DiscountType } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CouponRejectionReason =
  | 'unrecognized'
  | 'expired'
  | 'min_amount'
  | 'max_usage'
  | 'inactive';

export interface CouponApplyResult {
  success: true;
  discount: number;
  discountType: DiscountType;
  code: string;
  couponId: string;
}

export interface CouponRejectResult {
  success: false;
  reason: CouponRejectionReason;
}

export type CouponValidationResult = CouponApplyResult | CouponRejectResult;

// ─── Coupon Service ────────────────────────────────────────────────────────────

export const CouponService = {
  /**
   * Validate and apply a coupon code against the current cart subtotal.
   *
   * Returns the discount amount on success, or a specific rejection reason on failure.
   * Does NOT increment usage — that happens at order placement time.
   *
   * @param code - The coupon code to validate (case-insensitive)
   * @param cartSubtotal - The current cart subtotal before discount
   * @returns CouponApplyResult on success, CouponRejectResult on failure
   */
  async validateAndApply(
    code: string,
    cartSubtotal: number
  ): Promise<CouponValidationResult> {
    // Normalize code to uppercase for lookup
    const normalizedCode = code.trim().toUpperCase();

    // Look up the coupon by code
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    // Code doesn't exist
    if (!coupon) {
      return { success: false, reason: 'unrecognized' };
    }

    // Coupon is manually deactivated
    if (!coupon.isActive) {
      return { success: false, reason: 'inactive' };
    }

    // Check expiry date
    const now = new Date();
    if (coupon.expiryDate <= now) {
      return { success: false, reason: 'expired' };
    }

    // Check minimum order amount
    const minOrderAmount = Number(coupon.minOrderAmount);
    if (cartSubtotal < minOrderAmount) {
      return { success: false, reason: 'min_amount' };
    }

    // Check usage limit
    if (coupon.currentUsage >= coupon.maxUsage) {
      // Auto-deactivate when max usage reached
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { isActive: false },
      });
      return { success: false, reason: 'max_usage' };
    }

    // Calculate discount based on type
    const discountValue = Number(coupon.discountValue);
    let discount: number;

    if (coupon.discountType === 'PERCENTAGE') {
      discount = cartSubtotal * (discountValue / 100);
    } else {
      // FIXED discount
      discount = discountValue;
    }

    // Discount cannot exceed cart subtotal
    discount = Math.min(discount, cartSubtotal);

    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    return {
      success: true,
      discount,
      discountType: coupon.discountType,
      code: coupon.code,
      couponId: coupon.id,
    };
  },

  /**
   * Remove a coupon from the cart (no-op on the coupon itself).
   * Returns the coupon code that was removed.
   *
   * @param code - The coupon code to remove
   * @returns The removed coupon code, or null if not found
   */
  async removeCoupon(code: string): Promise<string | null> {
    const normalizedCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return null;
    }

    return coupon.code;
  },

  /**
   * Increment the usage count of a coupon (called at order placement).
   * Auto-deactivates the coupon if maxUsage is reached after increment.
   *
   * @param couponId - The coupon ID to increment
   */
  async incrementUsage(couponId: string): Promise<void> {
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        currentUsage: { increment: 1 },
      },
    });

    // Auto-deactivate when max usage reached
    if (coupon.currentUsage >= coupon.maxUsage) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: false },
      });
    }
  },
};
