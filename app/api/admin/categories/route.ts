/**
 * Paint & Keep - Admin Categories API Route
 *
 * GET /api/admin/categories - List all categories for admin product forms.
 *
 * Protected by admin auth middleware.
 */

import { NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError } from '@/lib/api-error';
import prisma from '@/lib/prisma';

export const GET = withAdminRequired(
  async (_request: AuthenticatedRequest) => {
    try {
      const categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ categories });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);
