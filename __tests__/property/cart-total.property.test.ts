import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Sample property test demonstrating fast-check integration with Vitest.
 * This tests the cart total calculation invariant.
 *
 * **Validates: Requirements 11.3**
 */
describe('Cart Total Calculation - Property Tests', () => {
  // Cart total formula: total = Σ(price_i × qty_i) - discount + shipping
  function calculateCartTotal(
    items: Array<{ price: number; quantity: number }>,
    discount: number,
    shippingCost: number
  ): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal - discount + shippingCost;
  }

  it('total should always be non-negative when discount ≤ subtotal', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
            quantity: fc.integer({ min: 1, max: 99 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true }),
        (items, shippingCost) => {
          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const discount = subtotal * 0.5; // discount never exceeds subtotal
          const total = calculateCartTotal(items, discount, shippingCost);
          expect(total).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding an item should always increase subtotal', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
            quantity: fc.integer({ min: 1, max: 99 }),
          }),
          { minLength: 0, maxLength: 19 }
        ),
        fc.record({
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
          quantity: fc.integer({ min: 1, max: 99 }),
        }),
        (existingItems, newItem) => {
          const subtotalBefore = existingItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          const subtotalAfter = [...existingItems, newItem].reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          expect(subtotalAfter).toBeGreaterThan(subtotalBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty cart should have zero subtotal', () => {
    const total = calculateCartTotal([], 0, 50);
    expect(total).toBe(50); // Only shipping cost
  });
});
