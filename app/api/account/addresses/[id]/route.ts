/**
 * Paint & Keep - Account Address Detail API
 *
 * PATCH  /api/account/addresses/[id] - Update an address
 * DELETE /api/account/addresses/[id] - Delete an address
 *
 * Requirements: 13.6
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { validateName, validatePhone } from '@/lib/validation';

/**
 * PATCH /api/account/addresses/[id]
 * Update an existing address.
 */
const updateAddress: AuthenticatedHandler = async (request, context) => {
  try {
    const { userId } = request.session;
    const addressId = context?.params?.id;

    if (!addressId) {
      throw badRequest('Address ID is required');
    }

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw notFound('Address not found');
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Validate and collect update fields
    if (body.fullName !== undefined) {
      const nameResult = validateName(body.fullName, 100);
      if (!nameResult.valid) throw badRequest(nameResult.error!);
      updateData.fullName = body.fullName.trim();
    }

    if (body.phone !== undefined) {
      const phoneResult = validatePhone(body.phone);
      if (!phoneResult.valid) throw badRequest(phoneResult.error!);
      updateData.phone = body.phone.trim();
    }

    if (body.line1 !== undefined) {
      if (!body.line1 || body.line1.trim().length === 0) throw badRequest('Address line 1 is required');
      if (body.line1.trim().length > 200) throw badRequest('Address line 1 must not exceed 200 characters');
      updateData.line1 = body.line1.trim();
    }

    if (body.line2 !== undefined) {
      if (body.line2 && body.line2.trim().length > 200) throw badRequest('Address line 2 must not exceed 200 characters');
      updateData.line2 = body.line2 ? body.line2.trim() : null;
    }

    if (body.city !== undefined) {
      if (!body.city || body.city.trim().length === 0) throw badRequest('City is required');
      if (body.city.trim().length > 100) throw badRequest('City must not exceed 100 characters');
      updateData.city = body.city.trim();
    }

    if (body.state !== undefined) {
      if (!body.state || body.state.trim().length === 0) throw badRequest('State is required');
      if (body.state.trim().length > 100) throw badRequest('State must not exceed 100 characters');
      updateData.state = body.state.trim();
    }

    if (body.postalCode !== undefined) {
      if (!body.postalCode || body.postalCode.trim().length === 0) throw badRequest('Postal code is required');
      if (body.postalCode.trim().length > 10) throw badRequest('Postal code must not exceed 10 characters');
      updateData.postalCode = body.postalCode.trim();
    }

    if (body.country !== undefined) {
      if (!body.country || body.country.trim().length === 0) throw badRequest('Country is required');
      if (body.country.trim().length > 100) throw badRequest('Country must not exceed 100 characters');
      updateData.country = body.country.trim();
    }

    if (body.isDefault !== undefined) {
      if (body.isDefault) {
        // Unset existing default
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      updateData.isDefault = Boolean(body.isDefault);
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest('No valid fields to update');
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * DELETE /api/account/addresses/[id]
 * Delete an address. If it was default, promotes another address.
 */
const deleteAddress: AuthenticatedHandler = async (request, context) => {
  try {
    const { userId } = request.session;
    const addressId = context?.params?.id;

    if (!addressId) {
      throw badRequest('Address ID is required');
    }

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw notFound('Address not found');
    }

    await prisma.address.delete({ where: { id: addressId } });

    // If deleted address was default, promote the most recent one
    if (existing.isDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = withAuthRequired(updateAddress);
export const DELETE = withAuthRequired(deleteAddress);
