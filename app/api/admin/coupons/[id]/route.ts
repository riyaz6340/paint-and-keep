/**
 * Paint & Keep - Admin Single Coupon API Route
 *
 * GET /api/admin/coupons/[id] - Get coupon details with usage analytics
 * PATCH /api/admin/coupons/[id] - Update coupon (edit fields, activate/deactivate)
 * DELETE /api/admin/coupons/[id] - Delete a coupon
 *
 * Protected by admin auth middleware (super_admin, marketing roles).
 * Requirements: 19.1, 19.4, 19.5
 */

import { NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/coupons/[id]
 * Get full coupon details with usage analytics.
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;
      if (!id) throw badRequest('Coupon ID is required');

      const coupon = await prisma.coupon.findUnique({
        where: { id },
        include: {
          usages: {
            select: {
              id: true,
              orderId: true,
              userId: true,
              usedAt: true,
            },
            orderBy: { usedAt: 'desc' },
          },
          orders: {
            select: {
              id: true,
              orderNumber: true,
              discount: true,
              total: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!coupon) {
        throw notFound(`Coupon not found: ${id}`);
      }

      const totalDiscountApplied = coupon.orders.reduce(
        (sum, order) => sum + Number(order.discount),
        0
      );

      return NextResponse.json({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: Number(coupon.minOrderAmount),
        maxUsage: coupon.maxUsage,
        currentUsage: coupon.currentUsage,
        expiryDate: coupon.expiryDate,
        isActive: coupon.isActive,
        isExpired: coupon.expiryDate <= new Date(),
        createdAt: coupon.createdAt,
        analytics: {
          totalUses: coupon.currentUsage,
          totalDiscountApplied: Math.round(totalDiscountApplied * 100) / 100,
          orderReferences: coupon.orders.map((o) => ({
            orderId: o.id,
            orderNumber: o.orderNumber,
            discount: Number(o.discount),
            total: Number(o.total),
            createdAt: o.createdAt,
          })),
        },
        usages: coupon.usages,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'marketing']
);

/**
 * PATCH /api/admin/coupons/[id]
 * Update a coupon. Supports field edits and activate/deactivate toggle.
 */
export const PATCH = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;
      if (!id) throw badRequest('Coupon ID is required');

      // Verify coupon exists
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw notFound(`Coupon not found: ${id}`);
      }

      const body = await request.json();
      const errors: Record<string, string> = {};

      // Validate code if provided
      if (body.code !== undefined) {
        const code = String(body.code).trim().toUpperCase();
        if (code.length < 3 || code.length > 20) {
          errors.code = 'Coupon code must be between 3 and 20 characters';
        } else if (!/^[A-Z0-9]+$/.test(code)) {
          errors.code = 'Coupon code must contain only letters and numbers';
        } else if (code !== existing.code) {
          // Check uniqueness only if code is changing
          const duplicate = await prisma.coupon.findUnique({ where: { code } });
          if (duplicate) {
            errors.code = 'A coupon with this code already exists';
          }
        }
      }

      // Validate discount type if provided
      if (body.discountType !== undefined) {
        const validDiscountTypes = ['PERCENTAGE', 'FIXED'];
        if (!validDiscountTypes.includes(body.discountType)) {
          errors.discountType = 'Discount type must be "PERCENTAGE" or "FIXED"';
        }
      }

      // Validate discount value if provided
      if (body.discountValue !== undefined) {
        const value = Number(body.discountValue);
        if (isNaN(value)) {
          errors.discountValue = 'Discount value must be a number';
        } else {
          const type = body.discountType || existing.discountType;
          if (type === 'PERCENTAGE') {
            if (value < 1 || value > 99) {
              errors.discountValue = 'Percentage discount must be between 1 and 99';
            }
          } else if (type === 'FIXED') {
            if (value < 0.01 || value > 999999.99) {
              errors.discountValue = 'Fixed discount must be between 0.01 and 999,999.99';
            }
          }
        }
      }

      // Validate min order amount if provided
      if (body.minOrderAmount !== undefined) {
        const minAmount = Number(body.minOrderAmount);
        if (isNaN(minAmount) || minAmount < 0 || minAmount > 999999.99) {
          errors.minOrderAmount = 'Minimum order amount must be between 0 and 999,999.99';
        }
      }

      // Validate expiry date if provided
      if (body.expiryDate !== undefined) {
        const expiry = new Date(body.expiryDate);
        if (isNaN(expiry.getTime())) {
          errors.expiryDate = 'Invalid expiry date format';
        } else if (expiry <= new Date()) {
          errors.expiryDate = 'Expiry date must be in the future';
        }
      }

      // Validate usage limit if provided
      if (body.maxUsage !== undefined) {
        const maxUsage = Number(body.maxUsage);
        if (!Number.isInteger(maxUsage) || maxUsage < 1 || maxUsage > 1000000) {
          errors.maxUsage = 'Usage limit must be between 1 and 1,000,000';
        }
      }

      if (Object.keys(errors).length > 0) {
        throw badRequest('Validation failed', { errors });
      }

      // Build update data
      const updateData: Record<string, unknown> = {};

      if (body.code !== undefined) updateData.code = String(body.code).trim().toUpperCase();
      if (body.discountType !== undefined) updateData.discountType = body.discountType;
      if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
      if (body.minOrderAmount !== undefined) updateData.minOrderAmount = Number(body.minOrderAmount);
      if (body.maxUsage !== undefined) updateData.maxUsage = Number(body.maxUsage);
      if (body.expiryDate !== undefined) updateData.expiryDate = new Date(body.expiryDate);
      if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

      const updatedCoupon = await prisma.coupon.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        id: updatedCoupon.id,
        code: updatedCoupon.code,
        discountType: updatedCoupon.discountType,
        discountValue: Number(updatedCoupon.discountValue),
        minOrderAmount: Number(updatedCoupon.minOrderAmount),
        maxUsage: updatedCoupon.maxUsage,
        currentUsage: updatedCoupon.currentUsage,
        expiryDate: updatedCoupon.expiryDate,
        isActive: updatedCoupon.isActive,
        createdAt: updatedCoupon.createdAt,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'marketing']
);

/**
 * DELETE /api/admin/coupons/[id]
 * Delete a coupon permanently.
 */
export const DELETE = withAdminRequired(
  async (request: AuthenticatedRequest, context?: { params: Record<string, string> }) => {
    try {
      const id = context?.params?.id;
      if (!id) throw badRequest('Coupon ID is required');

      // Verify coupon exists
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw notFound(`Coupon not found: ${id}`);
      }

      // Delete associated usages first (cascade)
      await prisma.couponUsage.deleteMany({ where: { couponId: id } });

      // Remove coupon references from orders
      await prisma.order.updateMany({
        where: { couponId: id },
        data: { couponId: null },
      });

      // Delete the coupon
      await prisma.coupon.delete({ where: { id } });

      return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'marketing']
);
