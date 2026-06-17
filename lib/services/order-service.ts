/**
 * Paint & Keep - Order Service
 *
 * Manages order lifecycle including:
 * - Status transition validation (state machine)
 * - Status history recording with admin identity and timestamps
 * - Email notifications on status changes (within 5 minutes)
 * - Order retrieval with full details (items, address, history)
 * - Admin order listing with filtering and pagination
 * - Order cancellation logic
 *
 * Allowed transitions:
 *   PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
 *   PENDING → CANCELLED
 *   PAID → CANCELLED → REFUNDED
 *   PROCESSING → CANCELLED → REFUNDED
 *
 * Requirements: 16.1, 16.2, 16.7, 16.8
 */

import { OrderStatus } from '@prisma/client';

import prisma from '@/lib/prisma';
import { badRequest, notFound } from '@/lib/api-error';
import { sendNotificationAsync } from '@/lib/notifications';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  customer?: string; // name or email partial match
  paymentMethod?: 'RAZORPAY' | 'STRIPE';
  page?: number;
  limit?: number;
}

export interface OrderListResult {
  orders: OrderSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  createdAt: Date;
  itemCount: number;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentId: string | null;
  giftNote: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemDetail[];
  address: OrderAddress;
  statusHistory: StatusHistoryEntry[];
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface StatusHistoryEntry {
  id: string;
  status: OrderStatus;
  adminId: string | null;
  adminName: string | null;
  note: string | null;
  createdAt: Date;
}

// ─── Allowed Transitions (State Machine) ───────────────────────────────────────

/**
 * Defines valid order status transitions.
 * Each key maps to an array of statuses it can transition to.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

/**
 * Human-readable status labels for email notifications.
 */
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

// ─── Order Service ─────────────────────────────────────────────────────────────

export const OrderService = {
  /**
   * Transition an order to a new status.
   *
   * - Validates the transition is allowed
   * - Updates the order status
   * - Records the change in StatusHistory with timestamp and admin identity
   * - Sends an email notification to the customer
   *
   * @param orderId - The order's ID
   * @param newStatus - The target status
   * @param adminId - The admin performing the transition (optional for system transitions)
   * @param note - Optional note explaining the transition
   */
  async transitionOrder(
    orderId: string,
    newStatus: OrderStatus,
    adminId?: string,
    note?: string
  ): Promise<OrderDetail> {
    // 1. Fetch the order with customer info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, name: true } },
        address: true,
      },
    });

    if (!order) {
      throw notFound(`Order not found: ${orderId}`);
    }

    // 2. Validate the transition
    const currentStatus = order.status;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowedNext.includes(newStatus)) {
      throw badRequest(
        `Invalid status transition: ${STATUS_LABELS[currentStatus]} → ${STATUS_LABELS[newStatus]}. ` +
          `Allowed transitions from ${STATUS_LABELS[currentStatus]}: ${allowedNext.map((s) => STATUS_LABELS[s]).join(', ') || 'none'}`,
        {
          currentStatus,
          requestedStatus: newStatus,
          allowedTransitions: allowedNext,
        }
      );
    }

    // 3. Update order status and record history in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      await tx.statusHistory.create({
        data: {
          orderId,
          status: newStatus,
          adminId: adminId || null,
          note: note || null,
        },
      });
    });

    // 4. Send email notification to the customer (non-blocking)
    const customerEmail = order.user?.email || order.guestEmail;
    const customerName = order.user?.name || order.address.fullName;

    if (customerEmail) {
      this._sendStatusChangeNotification(
        customerEmail,
        order.userId || undefined,
        customerName,
        order.orderNumber,
        newStatus,
        order.trackingNumber,
        order.trackingCarrier
      );
    }

    // 5. Return the updated order detail
    return this.getOrder(orderId);
  },

  /**
   * Get full order details including items, address, and status history.
   */
  async getOrder(orderId: string): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true } },
          },
        },
        address: true,
        statusHistory: {
          include: {
            admin: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      throw notFound(`Order not found: ${orderId}`);
    }

    const customerName = order.user?.name || order.address.fullName;
    const customerEmail = order.user?.email || order.guestEmail || '';

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName,
      customerEmail,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      giftNote: order.giftNote,
      trackingCarrier: order.trackingCarrier,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      address: {
        fullName: order.address.fullName,
        phone: order.address.phone,
        line1: order.address.line1,
        line2: order.address.line2,
        city: order.address.city,
        state: order.address.state,
        postalCode: order.address.postalCode,
        country: order.address.country,
      },
      statusHistory: order.statusHistory.map((entry) => ({
        id: entry.id,
        status: entry.status,
        adminId: entry.adminId,
        adminName: entry.admin?.name || null,
        note: entry.note,
        createdAt: entry.createdAt,
      })),
    };
  },

  /**
   * List orders with filtering and pagination for admin use.
   *
   * Supports filtering by: status, date range, customer name/email, payment method.
   * Results are paginated at max 50 per page.
   */
  async listOrders(filters: OrderFilters = {}): Promise<OrderListResult> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
      }
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.customer) {
      const searchTerm = filters.customer.trim();
      where.OR = [
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { guestEmail: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          address: { select: { fullName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || order.address.fullName,
        customerEmail: order.user?.email || order.guestEmail || '',
        status: order.status,
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        itemCount: order._count.items,
      })),
      total,
      page,
      totalPages,
    };
  },

  /**
   * Cancel an order. Validates that cancellation is allowed from the current status.
   * Equivalent to transitionOrder(orderId, CANCELLED, adminId, note).
   */
  async cancelOrder(
    orderId: string,
    adminId?: string,
    note?: string
  ): Promise<OrderDetail> {
    return this.transitionOrder(
      orderId,
      OrderStatus.CANCELLED,
      adminId,
      note || 'Order cancelled'
    );
  },

  /**
   * Send status change notification to the customer (fire-and-forget).
   * Uses the appropriate notification type based on the new status.
   */
  _sendStatusChangeNotification(
    customerEmail: string,
    userId: string | undefined,
    customerName: string,
    orderNumber: string,
    newStatus: OrderStatus,
    trackingNumber: string | null,
    trackingCarrier: string | null
  ): void {
    switch (newStatus) {
      case OrderStatus.SHIPPED:
        sendNotificationAsync({
          type: 'SHIPPING_UPDATE',
          recipient: customerEmail,
          recipientId: userId,
          data: {
            customerName,
            orderNumber,
            trackingNumber: trackingNumber || 'Pending',
            carrier: trackingCarrier || 'To be assigned',
            status: 'shipped',
          },
        });
        break;

      case OrderStatus.DELIVERED:
        sendNotificationAsync({
          type: 'DELIVERY_CONFIRMATION',
          recipient: customerEmail,
          recipientId: userId,
          data: {
            customerName,
            orderNumber,
            trackingNumber: trackingNumber || '',
            carrier: trackingCarrier || '',
          },
        });
        break;

      case OrderStatus.PAID:
      case OrderStatus.PROCESSING:
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        // Use SHIPPING_UPDATE as a general status update notification
        sendNotificationAsync({
          type: 'SHIPPING_UPDATE',
          recipient: customerEmail,
          recipientId: userId,
          data: {
            customerName,
            orderNumber,
            trackingNumber: trackingNumber || '',
            carrier: trackingCarrier || '',
            status: newStatus === OrderStatus.DELIVERED ? 'delivered' : 'in_transit',
          },
        });
        break;

      default:
        break;
    }
  },
};
