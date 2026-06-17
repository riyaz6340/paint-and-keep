/**
 * Paint & Keep - Account Profile API
 *
 * GET  /api/account/profile - Get current user's profile
 * PATCH /api/account/profile - Update profile (name, phone, profileImage)
 *
 * Requirements: 13.4, 13.5
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { validateName, validatePhone } from '@/lib/validation';

/**
 * GET /api/account/profile
 * Returns the authenticated user's profile data.
 */
const getProfile: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
        provider: true,
        emailVerified: true,
        points: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw badRequest('User not found');
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PATCH /api/account/profile
 * Update profile fields: name (max 100), phone (E.164), profileImage (S3 key).
 */
const updateProfile: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const body = await request.json();

    const { name, phone, profileImage } = body;
    const updateData: Record<string, unknown> = {};

    // Validate name if provided
    if (name !== undefined) {
      const nameResult = validateName(name, 100);
      if (!nameResult.valid) {
        throw badRequest(nameResult.error!);
      }
      updateData.name = name.trim();
    }

    // Validate phone if provided
    if (phone !== undefined) {
      if (phone === '' || phone === null) {
        updateData.phone = null;
      } else {
        const phoneResult = validatePhone(phone);
        if (!phoneResult.valid) {
          throw badRequest(phoneResult.error!);
        }
        updateData.phone = phone.trim();
      }
    }

    // Validate profileImage if provided (S3 key string)
    if (profileImage !== undefined) {
      if (profileImage === '' || profileImage === null) {
        updateData.profileImage = null;
      } else if (typeof profileImage !== 'string' || profileImage.length > 500) {
        throw badRequest('Invalid profile image key');
      } else {
        updateData.profileImage = profileImage;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest('No valid fields to update');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
        provider: true,
        emailVerified: true,
        points: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuthRequired(getProfile);
export const PATCH = withAuthRequired(updateProfile);
