/**
 * Paint & Keep - Admin Coupons API Route
 *
 * GET /api/admin/coupons - List all coupons with usage analytics
 * POST /api/admin/coupons - Create a new coupon
 *
 * Protected by admin auth middleware (super_admin, marketing roles).
 * Requirements: 19.1, 19.4, 19.5
 */

import { NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest } from '@/lib/api-error';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/coupons
 * Lists all coupons with usage analytics (total uses, total discount applied).
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = request.nextUrl;

      const search = searchParams.get('search') || undefined;
      const status = searchParams.get('status') || undefined; // active, inactive, expired
      const sortKey = searchParams.get('sortKey') || 'createdAt';
      const sortDir = searchParams.get('sortDir') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

      // Build where clause
      const where: Record<string, any> = {};

      if (status === 'active') {
        where.isActive = true;
        where.expiryDate = { gt: new Date() };
      } else if (status === 'inactive') {
        where.isActive = false;
      } else if (status === 'expired') {
        where.expiryDate = { lte: new Date() };
      }

      if (search && search.length >= 1) {
        where.code = { contains: search, mode: 'insensitive' };
      }

      // Build sort
      const validSortKeys = ['code', 'discountValue', 'currentUsage', 'expiryDate', 'createdAt'];
      const orderByKey = validSortKeys.includes(sortKey) ? sortKey : 'createdAt';
      const orderByDir = sortDir === 'asc' ? 'asc' : 'desc';
      const orderBy: Record<string, any> = {
        [orderByKey]: orderByDir,
      };

      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            usages: {
              select: {
                id: true,
                orderId: true,
                usedAt: true,
              },
            },
            orders: {
              select: {
                id: true,
                orderNumber: true,
                discount: true,
              },
            },
          },
        }),
        prisma.coupon.count({ where }),
      ]);

      const formattedCoupons = coupons.map((coupon) => {
        const totalDiscountApplied = coupon.orders.reduce(
          (sum, order) => sum + Number(order.discount),
          0
        );

        return {
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
            })),
          },
        };
      });

      return NextResponse.json({
        coupons: formattedCoupons,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'marketing']
);

/**
 * POST /api/admin/coupons
 * Create a new coupon with validation.
 */
export const POST = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const errors: Record<string, string> = {};

      // Validate code: 3-20 alphanumeric characters
      if (!body.code || typeof body.code !== 'string') {
        errors.code = 'Coupon code is required';
      } else {
        const code = body.code.trim().toUpperCase();
        if (code.length < 3 || code.length > 20) {
          errors.code = 'Coupon code must be between 3 and 20 characters';
        } else if (!/^[A-Z0-9]+$/.test(code)) {
          errors.code = 'Coupon code must contain only letters and numbers';
        } else {
          // Check uniqueness
          const existing = await prisma.coupon.findUnique({ where: { code } });
          if (existing) {
            errors.code = 'A coupon with this code already exists';
          }
        }
      }

      // Validate discount type
      const validDiscountTypes = ['PERCENTAGE', 'FIXED'];
      if (!body.discountType || !validDiscountTypes.includes(body.discountType)) {
        errors.discountType = 'Discount type must be "PERCENTAGE" or "FIXED"';
      }

      // Validate discount value
      if (body.discountValue === undefined || body.discountValue === null || isNaN(Number(body.discountValue))) {
        errors.discountValue = 'Discount value is required';
      } else {
        const value = Number(body.discountValue);
        if (body.discountType === 'PERCENTAGE') {
          if (value < 1 || value > 99) {
            errors.discountValue = 'Percentage discount must be between 1 and 99';
          }
        } else if (body.discountType === 'FIXED') {
          if (value < 0.01 || value > 999999.99) {
            errors.discountValue = 'Fixed discount must be between 0.01 and 999,999.99';
          }
        }
      }

      // Validate min order amount
      if (body.minOrderAmount !== undefined && body.minOrderAmount !== null) {
        const minAmount = Number(body.minOrderAmount);
        if (isNaN(minAmount) || minAmount < 0 || minAmount > 999999.99) {
          errors.minOrderAmount = 'Minimum order amount must be between 0 and 999,999.99';
        }
      }

      // Validate expiry date (must be in the future)
      if (!body.expiryDate) {
        errors.expiryDate = 'Expiry date is required';
      } else {
        const expiry = new Date(body.expiryDate);
        if (isNaN(expiry.getTime())) {
          errors.expiryDate = 'Invalid expiry date format';
        } else if (expiry <= new Date()) {
          errors.expiryDate = 'Expiry date must be in the future';
        }
      }

      // Validate usage limit: 1 - 1,000,000
      if (body.maxUsage === undefined || body.maxUsage === null || isNaN(Number(body.maxUsage))) {
        errors.maxUsage = 'Usage limit is required';
      } else {
        const maxUsage = Number(body.maxUsage);
        if (!Number.isInteger(maxUsage) || maxUsage < 1 || maxUsage > 1000000) {
          errors.maxUsage = 'Usage limit must be between 1 and 1,000,000';
        }
      }

      if (Object.keys(errors).length > 0) {
        throw badRequest('Validation failed', { errors });
      }

      // Create the coupon
      const coupon = await prisma.coupon.create({
        data: {
          code: body.code.trim().toUpperCase(),
          discountType: body.discountType,
          discountValue: Number(body.discountValue),
          minOrderAmount: body.minOrderAmount !== undefined ? Number(body.minOrderAmount) : 0,
          maxUsage: Number(body.maxUsage),
          expiryDate: new Date(body.expiryDate),
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        },
      });

      return NextResponse.json(
        {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minOrderAmount: Number(coupon.minOrderAmount),
          maxUsage: coupon.maxUsage,
          currentUsage: coupon.currentUsage,
          expiryDate: coupon.expiryDate,
          isActive: coupon.isActive,
          createdAt: coupon.createdAt,
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'marketing']
);
