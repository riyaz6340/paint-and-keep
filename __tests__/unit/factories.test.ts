import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetFactories,
  createUser,
  createProduct,
  createOrder,
  createOrderItem,
  createAddress,
  createCartItem,
  createCart,
  createCoupon,
  createReview,
  createGalleryPhoto,
  createAdmin,
} from '../utils/factories';

describe('Test Factories', () => {
  beforeEach(() => {
    resetFactories();
  });

  describe('createUser', () => {
    it('should create a user with default values', () => {
      const user = createUser();

      expect(user.id).toBeDefined();
      expect(user.email).toContain('@example.com');
      expect(user.name).toContain('Test User');
      expect(user.emailVerified).toBe(true);
      expect(user.provider).toBe('EMAIL');
    });

    it('should allow overriding default values', () => {
      const user = createUser({ name: 'Custom Name', provider: 'GOOGLE' });

      expect(user.name).toBe('Custom Name');
      expect(user.provider).toBe('GOOGLE');
    });
  });

  describe('createProduct', () => {
    it('should create a product with default values', () => {
      const product = createProduct();

      expect(product.price).toBe(29.99);
      expect(product.stockQuantity).toBe(100);
      expect(product.isActive).toBe(true);
      expect(product.difficultyLevel).toBe('EASY');
    });

    it('should allow creating an out-of-stock product', () => {
      const product = createProduct({ stockQuantity: 0 });

      expect(product.stockQuantity).toBe(0);
    });
  });

  describe('createOrder', () => {
    it('should calculate total correctly', () => {
      const order = createOrder({
        items: [
          createOrderItem({ unitPrice: 100, quantity: 2 }),
          createOrderItem({ unitPrice: 50, quantity: 1 }),
        ],
        discount: 25,
        shippingCost: 50,
      });

      // subtotal: (100*2) + (50*1) = 250
      // total: 250 - 25 + 50 = 275
      expect(order.subtotal).toBe(250);
      expect(order.total).toBe(275);
    });
  });

  describe('createCart', () => {
    it('should calculate cart total correctly', () => {
      const cart = createCart({
        items: [
          createCartItem({ price: 30, quantity: 3 }),
        ],
        discount: 10,
        shippingCost: 40,
      });

      // subtotal: 30*3 = 90
      // total: 90 - 10 + 40 = 120
      expect(cart.subtotal).toBe(90);
      expect(cart.total).toBe(120);
    });
  });

  describe('createCoupon', () => {
    it('should create an active coupon with future expiry', () => {
      const coupon = createCoupon();

      expect(coupon.isActive).toBe(true);
      expect(coupon.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(coupon.currentUsage).toBe(0);
    });
  });

  describe('createReview', () => {
    it('should create an approved review', () => {
      const review = createReview();

      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(review.status).toBe('APPROVED');
    });
  });

  describe('createGalleryPhoto', () => {
    it('should create an approved gallery photo', () => {
      const photo = createGalleryPhoto();

      expect(photo.status).toBe('APPROVED');
      expect(photo.likeCount).toBe(0);
    });
  });

  describe('createAdmin', () => {
    it('should create a super admin by default', () => {
      const admin = createAdmin();

      expect(admin.role).toBe('SUPER_ADMIN');
      expect(admin.email).toContain('@paintandkeep.com');
    });

    it('should allow creating other roles', () => {
      const admin = createAdmin({ role: 'MARKETING' });

      expect(admin.role).toBe('MARKETING');
    });
  });

  describe('createAddress', () => {
    it('should create a valid Indian address', () => {
      const address = createAddress();

      expect(address.country).toBe('India');
      expect(address.phone).toMatch(/^\+91/);
      expect(address.postalCode).toHaveLength(6);
    });
  });
});
