/**
 * Paint & Keep - Guest Cart Persistence (Redis-backed)
 *
 * Stores shopping cart items for guest (unauthenticated) users in Redis,
 * keyed by their session cookie. Cart data persists for 7 days.
 */

import { getRedisClient } from './redis';

/** Guest cart TTL: 7 days */
const GUEST_CART_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Redis key prefix for guest carts */
const CART_PREFIX = 'guest-cart:';

export interface GuestCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
}

/**
 * Build the Redis key for a guest cart.
 */
function cartKey(sessionId: string): string {
  return `${CART_PREFIX}${sessionId}`;
}

/**
 * Get the guest cart for a session.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @returns Array of cart items, or empty array if no cart exists or on error
 */
export async function getGuestCart(
  sessionId: string
): Promise<GuestCartItem[]> {
  try {
    const client = getRedisClient();
    const key = cartKey(sessionId);

    const data = await client.get(key);

    if (data === null) {
      return [];
    }

    return JSON.parse(data) as GuestCartItem[];
  } catch (error) {
    console.error('[GuestCart] Error getting cart:', error);
    return [];
  }
}

/**
 * Set the entire guest cart (replaces existing).
 * Refreshes the 7-day TTL on each update.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @param items - The complete cart items array
 * @returns true if saved successfully, false on error
 */
export async function setGuestCart(
  sessionId: string,
  items: GuestCartItem[]
): Promise<boolean> {
  try {
    const client = getRedisClient();
    const key = cartKey(sessionId);
    const serialized = JSON.stringify(items);

    await client.setex(key, GUEST_CART_TTL_SECONDS, serialized);
    return true;
  } catch (error) {
    console.error('[GuestCart] Error setting cart:', error);
    return false;
  }
}

/**
 * Add an item to the guest cart.
 * If the product already exists, increments the quantity.
 * Refreshes the 7-day TTL.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @param item - The item to add
 * @returns The updated cart, or null on error
 */
export async function addToGuestCart(
  sessionId: string,
  item: GuestCartItem
): Promise<GuestCartItem[] | null> {
  try {
    const cart = await getGuestCart(sessionId);

    const existingIndex = cart.findIndex(
      (i) => i.productId === item.productId
    );

    if (existingIndex >= 0) {
      // Update quantity (cap at 99 per product)
      cart[existingIndex].quantity = Math.min(
        cart[existingIndex].quantity + item.quantity,
        99
      );
    } else {
      cart.push({ ...item, quantity: Math.min(item.quantity, 99) });
    }

    const success = await setGuestCart(sessionId, cart);
    return success ? cart : null;
  } catch (error) {
    console.error('[GuestCart] Error adding item:', error);
    return null;
  }
}

/**
 * Update the quantity of a specific item in the guest cart.
 * Removes the item if quantity is set to 0.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @param productId - The product to update
 * @param quantity - New quantity (0 removes the item, max 99)
 * @returns The updated cart, or null on error
 */
export async function updateGuestCartItem(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<GuestCartItem[] | null> {
  try {
    let cart = await getGuestCart(sessionId);

    if (quantity <= 0) {
      cart = cart.filter((i) => i.productId !== productId);
    } else {
      const index = cart.findIndex((i) => i.productId === productId);
      if (index >= 0) {
        cart[index].quantity = Math.min(quantity, 99);
      }
    }

    const success = await setGuestCart(sessionId, cart);
    return success ? cart : null;
  } catch (error) {
    console.error('[GuestCart] Error updating item:', error);
    return null;
  }
}

/**
 * Remove an item from the guest cart.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @param productId - The product to remove
 * @returns The updated cart, or null on error
 */
export async function removeFromGuestCart(
  sessionId: string,
  productId: string
): Promise<GuestCartItem[] | null> {
  return updateGuestCartItem(sessionId, productId, 0);
}

/**
 * Clear the entire guest cart.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @returns true if cleared successfully, false on error
 */
export async function clearGuestCart(sessionId: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const key = cartKey(sessionId);

    await client.del(key);
    return true;
  } catch (error) {
    console.error('[GuestCart] Error clearing cart:', error);
    return false;
  }
}

/**
 * Get the total number of items in the guest cart.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @returns Total item count (sum of quantities), or 0 on error
 */
export async function getGuestCartCount(sessionId: string): Promise<number> {
  const cart = await getGuestCart(sessionId);
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get the subtotal for the guest cart.
 *
 * @param sessionId - The session cookie value identifying the guest
 * @returns The subtotal (sum of price × quantity), or 0 on error
 */
export async function getGuestCartSubtotal(
  sessionId: string
): Promise<number> {
  const cart = await getGuestCart(sessionId);
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}
