/**
 * Paint & Keep - Cart Service
 *
 * Provides cart operations for both authenticated users (Prisma/DB)
 * and guest users (Redis). Handles add, update quantity, remove,
 * clear, and total calculation.
 *
 * Cart total formula: total = Σ(price_i × qty_i) - discount + shipping
 *
 * Requirements: 11.1, 11.2, 11.3, 11.9, 11.10
 */

import prisma from '@/lib/prisma';
import {
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
  type GuestCartItem,
} from '@/lib/guest-cart';
import { badRequest, notFound } from '@/lib/api-error';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CartItemResponse {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string | null;
  subtotal: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface CartIdentifier {
  userId?: string;
  sessionId?: string;
}

// ─── Cart Service ──────────────────────────────────────────────────────────────

export const CartService = {
  /**
   * Get the full cart state including items with product details,
   * subtotal, discount, shipping, and total.
   */
  async getCart(identifier: CartIdentifier): Promise<CartResponse> {
    if (identifier.userId) {
      return getAuthenticatedCart(identifier.userId);
    }

    if (identifier.sessionId) {
      return getGuestCartResponse(identifier.sessionId);
    }

    // No identifier — return empty cart
    return emptyCart();
  },

  /**
   * Add a product to the cart. Validates stock availability.
   * If the product already exists, increments the quantity.
   *
   * @param identifier - userId or sessionId
   * @param productId - The product to add
   * @param quantity - Quantity to add (1-99)
   * @returns Updated cart state
   */
  async addItem(
    identifier: CartIdentifier,
    productId: string,
    quantity: number
  ): Promise<CartResponse> {
    // Validate quantity bounds
    if (quantity < 1 || quantity > 99) {
      throw badRequest('Quantity must be between 1 and 99');
    }

    // Validate product exists and check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        isPublished: true,
        images: {
          select: { url: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (!product || !product.isPublished) {
      throw notFound('Product not found');
    }

    if (product.stock <= 0) {
      throw badRequest('Product is out of stock', { productId });
    }

    if (identifier.userId) {
      return addItemAuthenticated(identifier.userId, product, quantity);
    }

    if (identifier.sessionId) {
      return addItemGuest(identifier.sessionId, product, quantity);
    }

    throw badRequest('No cart identifier provided');
  },

  /**
   * Update the quantity of an item in the cart.
   * Quantity must be between 1 and 99.
   *
   * @param identifier - userId or sessionId
   * @param productId - The product to update
   * @param quantity - New quantity (1-99)
   * @returns Updated cart state
   */
  async updateQuantity(
    identifier: CartIdentifier,
    productId: string,
    quantity: number
  ): Promise<CartResponse> {
    // Validate quantity bounds
    if (quantity < 1 || quantity > 99) {
      throw badRequest('Quantity must be between 1 and 99');
    }

    if (identifier.userId) {
      return updateQuantityAuthenticated(identifier.userId, productId, quantity);
    }

    if (identifier.sessionId) {
      return updateQuantityGuest(identifier.sessionId, productId, quantity);
    }

    throw badRequest('No cart identifier provided');
  },

  /**
   * Remove an item from the cart.
   *
   * @param identifier - userId or sessionId
   * @param productId - The product to remove
   * @returns Updated cart state
   */
  async removeItem(
    identifier: CartIdentifier,
    productId: string
  ): Promise<CartResponse> {
    if (identifier.userId) {
      return removeItemAuthenticated(identifier.userId, productId);
    }

    if (identifier.sessionId) {
      return removeItemGuest(identifier.sessionId, productId);
    }

    throw badRequest('No cart identifier provided');
  },

  /**
   * Clear all items from the cart.
   *
   * @param identifier - userId or sessionId
   * @returns Empty cart state
   */
  async clearCart(identifier: CartIdentifier): Promise<CartResponse> {
    if (identifier.userId) {
      await prisma.cartItem.deleteMany({
        where: { userId: identifier.userId },
      });
      return emptyCart();
    }

    if (identifier.sessionId) {
      await clearGuestCart(identifier.sessionId);
      return emptyCart();
    }

    throw badRequest('No cart identifier provided');
  },
};

// ─── Authenticated Cart Helpers (Prisma) ───────────────────────────────────────

async function getAuthenticatedCart(userId: string): Promise<CartResponse> {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          images: {
            select: { url: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const items: CartItemResponse[] = cartItems.map((item) => ({
    id: item.id,
    productId: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: Number(item.product.price),
    quantity: item.quantity,
    image: item.product.images[0]?.url || null,
    subtotal: Number(item.product.price) * item.quantity,
  }));

  return buildCartResponse(items);
}

async function addItemAuthenticated(
  userId: string,
  product: {
    id: string;
    name: string;
    slug: string;
    price: unknown;
    stock: number;
    images: { url: string }[];
  },
  quantity: number
): Promise<CartResponse> {
  // Check if item already in cart
  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: product.id,
      },
    },
  });

  if (existing) {
    // Increment quantity, capped at 99
    const newQuantity = Math.min(existing.quantity + quantity, 99);

    // Check stock for new total quantity
    if (newQuantity > product.stock) {
      throw badRequest(
        `Only ${product.stock} units available in stock`,
        { availableStock: product.stock }
      );
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    });
  } else {
    // Check stock for requested quantity
    if (quantity > product.stock) {
      throw badRequest(
        `Only ${product.stock} units available in stock`,
        { availableStock: product.stock }
      );
    }

    await prisma.cartItem.create({
      data: {
        userId,
        productId: product.id,
        quantity,
      },
    });
  }

  return getAuthenticatedCart(userId);
}

async function updateQuantityAuthenticated(
  userId: string,
  productId: string,
  quantity: number
): Promise<CartResponse> {
  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (!existing) {
    throw notFound('Item not found in cart');
  }

  await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity },
  });

  return getAuthenticatedCart(userId);
}

async function removeItemAuthenticated(
  userId: string,
  productId: string
): Promise<CartResponse> {
  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (!existing) {
    throw notFound('Item not found in cart');
  }

  await prisma.cartItem.delete({
    where: { id: existing.id },
  });

  return getAuthenticatedCart(userId);
}

// ─── Guest Cart Helpers (Redis) ────────────────────────────────────────────────

async function getGuestCartResponse(sessionId: string): Promise<CartResponse> {
  const guestItems = await getGuestCart(sessionId);

  const items: CartItemResponse[] = guestItems.map((item) => ({
    id: item.productId, // Use productId as ID for guest carts
    productId: item.productId,
    name: item.name,
    slug: item.slug || '',
    price: item.price,
    quantity: item.quantity,
    image: item.image || null,
    subtotal: item.price * item.quantity,
  }));

  return buildCartResponse(items);
}

async function addItemGuest(
  sessionId: string,
  product: {
    id: string;
    name: string;
    slug: string;
    price: unknown;
    stock: number;
    images: { url: string }[];
  },
  quantity: number
): Promise<CartResponse> {
  // Check current quantity in cart
  const currentCart = await getGuestCart(sessionId);
  const existingItem = currentCart.find((i) => i.productId === product.id);
  const currentQty = existingItem?.quantity || 0;
  const newTotalQty = Math.min(currentQty + quantity, 99);

  // Check stock for new total quantity
  if (newTotalQty > product.stock) {
    throw badRequest(
      `Only ${product.stock} units available in stock`,
      { availableStock: product.stock }
    );
  }

  const guestItem: GuestCartItem = {
    productId: product.id,
    name: product.name,
    price: Number(product.price),
    quantity,
    image: product.images[0]?.url,
    slug: product.slug,
  };

  const updatedCart = await addToGuestCart(sessionId, guestItem);

  if (!updatedCart) {
    throw badRequest('Failed to add item to cart');
  }

  return getGuestCartResponse(sessionId);
}

async function updateQuantityGuest(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<CartResponse> {
  const cart = await getGuestCart(sessionId);
  const existing = cart.find((i) => i.productId === productId);

  if (!existing) {
    throw notFound('Item not found in cart');
  }

  const updatedCart = await updateGuestCartItem(sessionId, productId, quantity);

  if (!updatedCart) {
    throw badRequest('Failed to update cart item');
  }

  return getGuestCartResponse(sessionId);
}

async function removeItemGuest(
  sessionId: string,
  productId: string
): Promise<CartResponse> {
  const cart = await getGuestCart(sessionId);
  const existing = cart.find((i) => i.productId === productId);

  if (!existing) {
    throw notFound('Item not found in cart');
  }

  const updatedCart = await removeFromGuestCart(sessionId, productId);

  if (!updatedCart) {
    throw badRequest('Failed to remove cart item');
  }

  return getGuestCartResponse(sessionId);
}

// ─── Shared Helpers ────────────────────────────────────────────────────────────

/**
 * Calculate cart totals from items.
 * Formula: total = subtotal - discount + shipping
 */
function buildCartResponse(items: CartItemResponse[]): CartResponse {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Discount and shipping default to 0 for now
  // These will be calculated by coupon system and shipping calculator
  const discount = 0;
  const shipping = 0;

  const total = subtotal - discount + shipping;

  return {
    items,
    itemCount,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function emptyCart(): CartResponse {
  return {
    items: [],
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
  };
}
