/**
 * Unit tests for CouponService
 *
 * Tests coupon validation, discount calculation, rejection reasons,
 * and auto-deactivation on maxUsage.
 *
 * Requirements: 11.4, 11.5, 11.6, 19.2, 19.3, 19.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../../utils';
import { CouponService } from '@/lib/services/coupon-service';

beforeEach(() => {
  resetPrismaMock();
});

// ─── Helper to create a mock coupon record ─────────────────────────────────────

/**
 * Creates a mock Decimal-like value that Prisma returns.
 * In the service, we convert to number via Number(), so we need
 * the mock to be coercible to number.
 */
function mockDecimal(value: number) {
  return {
    toNumber: () => value,
    toString: () => String(value),
    valueOf: () => value,
    [Symbol.toPrimitive]: () => value,
  };
}

function createMockCoupon(overrides: Record<string, unknown> = {}) {
  return {
    id: 'coupon-1',
    code: 'SAVE10',
    discountType: 'PERCENTAGE' as const,
    discountValue: mockDecimal(10),
    minOrderAmount: mockDecimal(100),
    maxUsage: 100,
    currentUsage: 5,
    expiryDate: new Date('2027-12-31T23:59:59Z'),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─── validateAndApply ──────────────────────────────────────────────────────────

describe('CouponService.validateAndApply', () => {
  it('returns unrecognized when code does not exist', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(null);

    const result = await CouponService.validateAndApply('BADCODE', 200);

    expect(result).toEqual({ success: false, reason: 'unrecognized' });
  });

  it('returns inactive when coupon is deactivated', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({ isActive: false }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({ success: false, reason: 'inactive' });
  });

  it('returns expired when coupon is past expiry date', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({ expiryDate: new Date('2020-01-01T00:00:00Z') }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({ success: false, reason: 'expired' });
  });

  it('returns min_amount when cart subtotal is below minimum', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({ minOrderAmount: mockDecimal(500) }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({ success: false, reason: 'min_amount' });
  });

  it('returns max_usage when coupon has reached usage limit', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({ maxUsage: 10, currentUsage: 10 }) as any
    );
    prismaMock.coupon.update.mockResolvedValue(
      createMockCoupon({ maxUsage: 10, currentUsage: 10, isActive: false }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({ success: false, reason: 'max_usage' });
    // Should auto-deactivate
    expect(prismaMock.coupon.update).toHaveBeenCalledWith({
      where: { id: 'coupon-1' },
      data: { isActive: false },
    });
  });

  it('calculates PERCENTAGE discount correctly', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({
        discountType: 'PERCENTAGE',
        discountValue: mockDecimal(15),
        minOrderAmount: mockDecimal(0),
      }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({
      success: true,
      discount: 30, // 200 * (15 / 100) = 30
      discountType: 'PERCENTAGE',
      code: 'SAVE10',
      couponId: 'coupon-1',
    });
  });

  it('calculates FIXED discount correctly', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({
        discountType: 'FIXED',
        discountValue: mockDecimal(50),
        minOrderAmount: mockDecimal(0),
      }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({
      success: true,
      discount: 50,
      discountType: 'FIXED',
      code: 'SAVE10',
      couponId: 'coupon-1',
    });
  });

  it('caps discount at cart subtotal for FIXED type', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({
        discountType: 'FIXED',
        discountValue: mockDecimal(500),
        minOrderAmount: mockDecimal(0),
      }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result).toEqual({
      success: true,
      discount: 200, // Capped at cart subtotal
      discountType: 'FIXED',
      code: 'SAVE10',
      couponId: 'coupon-1',
    });
  });

  it('normalizes coupon code to uppercase for lookup', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({ minOrderAmount: mockDecimal(0) }) as any
    );

    await CouponService.validateAndApply('save10', 200);

    expect(prismaMock.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: 'SAVE10' },
    });
  });

  it('trims whitespace from coupon code', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({ minOrderAmount: mockDecimal(0) }) as any
    );

    await CouponService.validateAndApply('  SAVE10  ', 200);

    expect(prismaMock.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: 'SAVE10' },
    });
  });

  it('succeeds when cart subtotal equals minOrderAmount exactly', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon({
        minOrderAmount: mockDecimal(200),
        discountType: 'PERCENTAGE',
        discountValue: mockDecimal(10),
      }) as any
    );

    const result = await CouponService.validateAndApply('SAVE10', 200);

    expect(result.success).toBe(true);
  });
});

// ─── removeCoupon ──────────────────────────────────────────────────────────────

describe('CouponService.removeCoupon', () => {
  it('returns coupon code when found', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      createMockCoupon() as any
    );

    const result = await CouponService.removeCoupon('SAVE10');

    expect(result).toBe('SAVE10');
  });

  it('returns null when coupon not found', async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(null);

    const result = await CouponService.removeCoupon('NOEXIST');

    expect(result).toBeNull();
  });
});

// ─── incrementUsage ────────────────────────────────────────────────────────────

describe('CouponService.incrementUsage', () => {
  it('increments currentUsage by 1', async () => {
    prismaMock.coupon.update.mockResolvedValue(
      createMockCoupon({ currentUsage: 6 }) as any
    );

    await CouponService.incrementUsage('coupon-1');

    expect(prismaMock.coupon.update).toHaveBeenCalledWith({
      where: { id: 'coupon-1' },
      data: { currentUsage: { increment: 1 } },
    });
  });

  it('auto-deactivates when maxUsage is reached after increment', async () => {
    prismaMock.coupon.update.mockResolvedValueOnce(
      createMockCoupon({ currentUsage: 100, maxUsage: 100 }) as any
    );
    prismaMock.coupon.update.mockResolvedValueOnce(
      createMockCoupon({ currentUsage: 100, maxUsage: 100, isActive: false }) as any
    );

    await CouponService.incrementUsage('coupon-1');

    expect(prismaMock.coupon.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.coupon.update).toHaveBeenLastCalledWith({
      where: { id: 'coupon-1' },
      data: { isActive: false },
    });
  });

  it('does not deactivate when usage is still below max', async () => {
    prismaMock.coupon.update.mockResolvedValue(
      createMockCoupon({ currentUsage: 50, maxUsage: 100 }) as any
    );

    await CouponService.incrementUsage('coupon-1');

    // Only called once (the increment), not a second time for deactivation
    expect(prismaMock.coupon.update).toHaveBeenCalledTimes(1);
  });
});
