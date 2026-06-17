/**
 * Paint & Keep - Admin Customers API Route
 *
 * GET /api/admin/customers - List customers with search, filters, and pagination
 *
 * Protected by admin auth middleware (super_admin, operations, customer_support).
 * Requirements: 17.1, 17.2, 17.5
 */

import { NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/admin/customers
 *
 * Query Parameters:
 * - search: partial match on name or email
 * - dateFrom: registration date range start (ISO string)
 * - dateTo: registration date range end (ISO string)
 * - minLifetimeValue: minimum lifetime spend
 * - maxLifetimeValue: maximum lifetime spend
 * - page: page number (default 1)
 * - limit: items per page (default 20, max 50)
 * - sortKey: field to sort by (name, email, createdAt, lifetimeSpend) default createdAt
 * - sortDir: asc or desc (default desc)
 */
export const GET = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = request.nextUrl;

      const search = searchParams.get('search') || undefined;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;
      const minLifetimeValue = searchParams.get('minLifetimeValue') || undefined;
      const maxLifetimeValue = searchParams.get('maxLifetimeValue') || undefined;
      const sortKey = searchParams.get('sortKey') || 'createdAt';
      const sortDir = searchParams.get('sortDir') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

      // Build where clause
      const where: Prisma.UserWhereInput = {};

      // Search by name or email (partial match)
      if (search && search.trim().length > 0) {
        where.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
        ];
      }

      // Date range filter on registration date
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (!isNaN(fromDate.getTime())) {
            where.createdAt.gte = fromDate;
          }
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          if (!isNaN(toDate.getTime())) {
            // Include the full end day
            toDate.setHours(23, 59, 59, 999);
            where.createdAt.lte = toDate;
          }
        }
      }

      // Lifetime value range filter
      if (minLifetimeValue || maxLifetimeValue) {
        where.lifetimeSpend = {};
        if (minLifetimeValue) {
          const minVal = parseFloat(minLifetimeValue);
          if (!isNaN(minVal)) {
            where.lifetimeSpend.gte = minVal;
          }
        }
        if (maxLifetimeValue) {
          const maxVal = parseFloat(maxLifetimeValue);
          if (!isNaN(maxVal)) {
            where.lifetimeSpend.lte = maxVal;
          }
        }
      }

      // Build sort
      const validSortKeys = ['name', 'email', 'createdAt', 'lifetimeSpend'];
      const orderByKey = validSortKeys.includes(sortKey) ? sortKey : 'createdAt';
      const orderByDir = sortDir === 'asc' ? 'asc' : 'desc';
      const orderBy: Prisma.UserOrderByWithRelationInput = {
        [orderByKey]: orderByDir,
      };

      const skip = (page - 1) * limit;

      const [customers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            subscribedMarketing: true,
            lifetimeSpend: true,
            createdAt: true,
            _count: {
              select: {
                orders: true,
                wishlistItems: true,
                reviews: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const formattedCustomers = customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        subscribedMarketing: c.subscribedMarketing,
        lifetimeSpend: Number(c.lifetimeSpend),
        createdAt: c.createdAt.toISOString(),
        orderCount: c._count.orders,
        wishlistCount: c._count.wishlistItems,
        reviewCount: c._count.reviews,
      }));

      return NextResponse.json({
        customers: formattedCustomers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations', 'customer_support']
);
