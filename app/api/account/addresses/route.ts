/**
 * Paint & Keep - Account Addresses API
 *
 * GET  /api/account/addresses - Get all user addresses (max 10)
 * POST /api/account/addresses - Create a new address
 *
 * Requirements: 13.6
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { validateName, validatePhone } from '@/lib/validation';

const MAX_ADDRESSES = 10;

/**
 * Validate address fields.
 */
function validateAddressFields(body: Record<string, unknown>): string | null {
  const { fullName, phone, line1, city, state, postalCode, country } = body;

  if (!fullName || typeof fullName !== 'string') return 'Full name is required';
  const nameResult = validateName(fullName as string, 100);
  if (!nameResult.valid) return nameResult.error!;

  if (!phone || typeof phone !== 'string') return 'Phone is required';
  const phoneResult = validatePhone(phone as string);
  if (!phoneResult.valid) return phoneResult.error!;

  if (!line1 || typeof line1 !== 'string' || (line1 as string).trim().length === 0)
    return 'Address line 1 is required';
  if ((line1 as string).trim().length > 200) return 'Address line 1 must not exceed 200 characters';

  if (!city || typeof city !== 'string' || (city as string).trim().length === 0)
    return 'City is required';
  if ((city as string).trim().length > 100) return 'City must not exceed 100 characters';

  if (!state || typeof state !== 'string' || (state as string).trim().length === 0)
    return 'State is required';
  if ((state as string).trim().length > 100) return 'State must not exceed 100 characters';

  if (!postalCode || typeof postalCode !== 'string' || (postalCode as string).trim().length === 0)
    return 'Postal code is required';
  if ((postalCode as string).trim().length > 10)
    return 'Postal code must not exceed 10 characters';

  if (!country || typeof country !== 'string' || (country as string).trim().length === 0)
    return 'Country is required';
  if ((country as string).trim().length > 100) return 'Country must not exceed 100 characters';

  return null;
}

/**
 * GET /api/account/addresses
 * Returns all addresses for the authenticated user.
 */
const getAddresses: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses, count: addresses.length, maxAllowed: MAX_ADDRESSES });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * POST /api/account/addresses
 * Create a new address. Max 10 per user.
 */
const createAddress: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const body = await request.json();

    // Check address limit
    const existingCount = await prisma.address.count({ where: { userId } });
    if (existingCount >= MAX_ADDRESSES) {
      throw badRequest(`Maximum ${MAX_ADDRESSES} addresses allowed`);
    }

    // Validate fields
    const validationError = validateAddressFields(body);
    if (validationError) {
      throw badRequest(validationError);
    }

    const { fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = body;

    // If setting as default, unset existing default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const shouldBeDefault = isDefault || existingCount === 0;

    const address = await prisma.address.create({
      data: {
        userId,
        fullName: (fullName as string).trim(),
        phone: (phone as string).trim(),
        line1: (line1 as string).trim(),
        line2: line2 ? (line2 as string).trim() : null,
        city: (city as string).trim(),
        state: (state as string).trim(),
        postalCode: (postalCode as string).trim(),
        country: (country as string).trim(),
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuthRequired(getAddresses);
export const POST = withAuthRequired(createAddress);
