/**
 * Test data factories for generating realistic test objects.
 * Uses a simple incremental ID strategy and sensible defaults.
 */

let idCounter = 0;

function nextId(): string {
  idCounter++;
  return `test-id-${idCounter}`;
}

/**
 * Reset the factory ID counter between test suites.
 */
export function resetFactories(): void {
  idCounter = 0;
}

// ─── User Factory ──────────────────────────────────────────────────────────────

export interface FactoryUser {
  id: string;
  email: string;
  name: string;
  password: string;
  phone: string | null;
  emailVerified: boolean;
  provider: 'EMAIL' | 'GOOGLE';
  profileImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createUser(overrides: Partial<FactoryUser> = {}): FactoryUser {
  const id = nextId();
  return {
    id,
    email: `user-${id}@example.com`,
    name: `Test User ${id}`,
    password: '$2b$12$hashedpasswordplaceholder',
    phone: null,
    emailVerified: true,
    provider: 'EMAIL',
    profileImage: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─── Product Factory ───────────────────────────────────────────────────────────

export interface FactoryProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  ageGroup: 'TODDLER' | 'CHILD' | 'TEEN' | 'ADULT' | 'ALL_AGES';
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createProduct(overrides: Partial<FactoryProduct> = {}): FactoryProduct {
  const id = nextId();
  return {
    id,
    name: `Paint Kit ${id}`,
    slug: `paint-kit-${id}`,
    description: 'A creative painting kit for kids and families.',
    price: 29.99,
    categoryId: 'cat-animals',
    ageGroup: 'CHILD',
    difficultyLevel: 'EASY',
    stockQuantity: 100,
    lowStockThreshold: 10,
    isActive: true,
    averageRating: 4.5,
    reviewCount: 12,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─── Order Factory ─────────────────────────────────────────────────────────────

export interface FactoryOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface FactoryOrder {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  items: FactoryOrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'RAZORPAY' | 'STRIPE';
  shippingAddress: FactoryAddress;
  createdAt: Date;
  updatedAt: Date;
}

export function createOrder(overrides: Partial<FactoryOrder> = {}): FactoryOrder {
  const id = nextId();
  const items = overrides.items ?? [createOrderItem()];
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = overrides.discount ?? 0;
  const shippingCost = overrides.shippingCost ?? 50;
  const total = subtotal - discount + shippingCost;

  return {
    id,
    userId: null,
    guestEmail: 'guest@example.com',
    status: 'PENDING',
    items,
    subtotal,
    discount,
    shippingCost,
    total,
    paymentMethod: 'RAZORPAY',
    shippingAddress: createAddress(),
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

export function createOrderItem(overrides: Partial<FactoryOrderItem> = {}): FactoryOrderItem {
  const id = nextId();
  return {
    id,
    productId: nextId(),
    productName: 'Paint Kit',
    quantity: 1,
    unitPrice: 29.99,
    ...overrides,
  };
}

// ─── Address Factory ───────────────────────────────────────────────────────────

export interface FactoryAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function createAddress(overrides: Partial<FactoryAddress> = {}): FactoryAddress {
  const id = nextId();
  return {
    id,
    fullName: 'Test Customer',
    phone: '+919876543210',
    addressLine1: '123 Creative Lane',
    addressLine2: null,
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    ...overrides,
  };
}

// ─── Cart Factory ──────────────────────────────────────────────────────────────

export interface FactoryCartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface FactoryCart {
  items: FactoryCartItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
}

export function createCartItem(overrides: Partial<FactoryCartItem> = {}): FactoryCartItem {
  const id = nextId();
  return {
    id,
    productId: nextId(),
    productName: 'Creative Paint Kit',
    price: 29.99,
    quantity: 1,
    image: '/images/products/kit-placeholder.webp',
    ...overrides,
  };
}

export function createCart(overrides: Partial<FactoryCart> = {}): FactoryCart {
  const items = overrides.items ?? [createCartItem()];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = overrides.discount ?? 0;
  const shippingCost = overrides.shippingCost ?? 50;
  const total = subtotal - discount + shippingCost;

  return {
    items,
    subtotal,
    discount,
    shippingCost,
    total,
    couponCode: null,
    ...overrides,
  };
}

// ─── Coupon Factory ────────────────────────────────────────────────────────────

export interface FactoryCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxUsage: number;
  currentUsage: number;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export function createCoupon(overrides: Partial<FactoryCoupon> = {}): FactoryCoupon {
  const id = nextId();
  return {
    id,
    code: `SAVE${id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 100,
    maxUsage: 100,
    currentUsage: 0,
    expiresAt: new Date('2027-12-31T23:59:59Z'),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─── Review Factory ────────────────────────────────────────────────────────────

export interface FactoryReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  text: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

export function createReview(overrides: Partial<FactoryReview> = {}): FactoryReview {
  const id = nextId();
  return {
    id,
    userId: nextId(),
    productId: nextId(),
    rating: 4,
    text: 'Great painting kit! My kids loved it and the colors were vibrant.',
    status: 'APPROVED',
    createdAt: new Date('2024-02-01T12:00:00Z'),
    ...overrides,
  };
}

// ─── Gallery Photo Factory ─────────────────────────────────────────────────────

export interface FactoryGalleryPhoto {
  id: string;
  userId: string;
  imageUrl: string;
  creatorName: string;
  kitName: string;
  likeCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
  createdAt: Date;
}

export function createGalleryPhoto(overrides: Partial<FactoryGalleryPhoto> = {}): FactoryGalleryPhoto {
  const id = nextId();
  return {
    id,
    userId: nextId(),
    imageUrl: `/gallery/photo-${id}.webp`,
    creatorName: 'Creative Kid',
    kitName: 'Unicorn Paint Kit',
    likeCount: 0,
    status: 'APPROVED',
    createdAt: new Date('2024-03-01T08:00:00Z'),
    ...overrides,
  };
}

// ─── Admin Factory ─────────────────────────────────────────────────────────────

export interface FactoryAdmin {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OPERATIONS' | 'MARKETING' | 'CUSTOMER_SUPPORT';
  createdAt: Date;
}

export function createAdmin(overrides: Partial<FactoryAdmin> = {}): FactoryAdmin {
  const id = nextId();
  return {
    id,
    email: `admin-${id}@paintandkeep.com`,
    name: `Admin ${id}`,
    role: 'SUPER_ADMIN',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}
