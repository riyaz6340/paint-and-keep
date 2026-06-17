/**
 * Paint & Keep - Admin Customer Detail API Route
 *
 * GET /api/admin/customers/[id] - Get single customer detail with orders, wishlist, reviews
 * PATCH /api/admin/customers/[id] - Update customer (e.g., toggle subscription status)
 *
 * Protected by admin auth middleware (super_admin, operations, customer_support).
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.6
 */

import { NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, notFound, badRequest } from '@/lib/api-error';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/customers/[id]
 *
 * Returns full customer profile including:
 * - Basic info: name, email, phone, registration date, status, subscription
 * - Purchase history (most recent 50 orders)
 * - Lifetime spend
 * - Wishlist contents (up to 100 items)
 * - Review history (up to 50 most recent reviews)
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;

      if (!id) {
        throw badRequest('Customer ID is required');
      }

      const customer = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          provider: true,
          emailVerified: true,
          isActive: true,
          subscribedMarketing: true,
          lifetimeSpend: true,
          points: true,
          createdAt: true,
          updatedAt: true,
          // Purchase history - most recent 50 orders (Requirement 17.1)
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true,
              items: {
                select: {
                  id: true,
                  quantity: true,
                  unitPrice: true,
                  total: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      images: {
                        select: { url: true, alt: true },
                        orderBy: { order: 'asc' },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
          // Wishlist contents - up to 100 items (Requirement 17.4)
          wishlistItems: {
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
              id: true,
              createdAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  images: {
                    select: { url: true, alt: true },
                    orderBy: { order: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
          // Review history - up to 50 most recent reviews (Requirement 17.4)
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
              id: true,
              rating: true,
              text: true,
              status: true,
              createdAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          // Counts for summary
          _count: {
            select: {
              orders: true,
              wishlistItems: true,
              reviews: true,
            },
          },
        },
      });

      if (!customer) {
        throw notFound('Customer not found');
      }

      // Format response
      const formattedCustomer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        profileImage: customer.profileImage,
        provider: customer.provider,
        emailVerified: customer.emailVerified,
        isActive: customer.isActive,
        subscribedMarketing: customer.subscribedMarketing,
        lifetimeSpend: Number(customer.lifetimeSpend),
        points: customer.points,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        orderCount: customer._count.orders,
        wishlistCount: customer._count.wishlistItems,
        reviewCount: customer._count.reviews,
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          items: o.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              image: item.product.images[0] || null,
            },
          })),
        })),
        wishlist: customer.wishlistItems.map((w) => ({
          id: w.id,
          createdAt: w.createdAt.toISOString(),
          product: {
            id: w.product.id,
            name: w.product.name,
            slug: w.product.slug,
            price: Number(w.product.price),
            image: w.product.images[0] || null,
          },
        })),
        reviews: customer.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          text: r.text,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          product: {
            id: r.product.id,
            name: r.product.name,
            slug: r.product.slug,
          },
        })),
      };

      return NextResponse.json(formattedCustomer);
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);

/**
 * PATCH /api/admin/customers/[id]
 *
 * Update customer fields. Currently supports:
 * - subscribedMarketing: toggle email subscription status (Requirement 17.2, 17.3)
 */
export const PATCH = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;

      if (!id) {
        throw badRequest('Customer ID is required');
      }

      const body = await request.json();

      // Verify customer exists
      const customer = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!customer) {
        throw notFound('Customer not found');
      }

      // Build update data - only allow specific field updates
      const updateData: { subscribedMarketing?: boolean } = {};

      if (typeof body.subscribedMarketing === 'boolean') {
        updateData.subscribedMarketing = body.subscribedMarketing;
      }

      if (Object.keys(updateData).length === 0) {
        throw badRequest('No valid fields to update');
      }

      const updatedCustomer = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          subscribedMarketing: true,
        },
      });

      return NextResponse.json({
        success: true,
        customer: updatedCustomer,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);
