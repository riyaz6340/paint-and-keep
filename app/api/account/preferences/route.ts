/**
 * Paint & Keep - Account Notification Preferences API
 *
 * GET   /api/account/preferences - Get notification preferences
 * PATCH /api/account/preferences - Update notification opt-in/opt-out
 *
 * Requirements: 13.4
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { withAuthRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

/** Notification types that users can control */
const USER_CONTROLLABLE_TYPES = [
  'ORDER_CONFIRMATION',
  'SHIPPING_UPDATE',
  'DELIVERY_CONFIRMATION',
  'BADGE_EARNED',
] as const;

/**
 * GET /api/account/preferences
 * Returns the user's notification preferences. Creates defaults if missing.
 */
const getPreferences: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;

    // Fetch existing preferences
    let preferences = await prisma.notificationPreference.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        optedIn: true,
      },
    });

    // If no preferences exist, initialize defaults (all opted in)
    if (preferences.length === 0) {
      await prisma.notificationPreference.createMany({
        data: USER_CONTROLLABLE_TYPES.map((type) => ({
          userId,
          type,
          optedIn: true,
        })),
      });

      preferences = await prisma.notificationPreference.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          optedIn: true,
        },
      });
    }

    // Also include marketing subscription from user model
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscribedMarketing: true },
    });

    return NextResponse.json({
      preferences,
      marketingEmails: user?.subscribedMarketing ?? true,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PATCH /api/account/preferences
 * Update notification preferences.
 * Body: { preferences: { type: boolean }[], marketingEmails?: boolean }
 */
const updatePreferences: AuthenticatedHandler = async (request) => {
  try {
    const { userId } = request.session;
    const body = await request.json();

    const { preferences, marketingEmails } = body;

    // Update notification preferences
    if (preferences && typeof preferences === 'object') {
      for (const [type, optedIn] of Object.entries(preferences)) {
        if (!USER_CONTROLLABLE_TYPES.includes(type as (typeof USER_CONTROLLABLE_TYPES)[number])) {
          throw badRequest(`Invalid notification type: ${type}`);
        }

        if (typeof optedIn !== 'boolean') {
          throw badRequest(`Value for ${type} must be a boolean`);
        }

        await prisma.notificationPreference.upsert({
          where: { userId_type: { userId, type: type as (typeof USER_CONTROLLABLE_TYPES)[number] } },
          create: { userId, type: type as (typeof USER_CONTROLLABLE_TYPES)[number], optedIn: optedIn as boolean },
          update: { optedIn: optedIn as boolean },
        });
      }
    }

    // Update marketing subscription
    if (marketingEmails !== undefined) {
      if (typeof marketingEmails !== 'boolean') {
        throw badRequest('marketingEmails must be a boolean');
      }
      await prisma.user.update({
        where: { id: userId },
        data: { subscribedMarketing: marketingEmails },
      });
    }

    // Return updated state
    const updatedPreferences = await prisma.notificationPreference.findMany({
      where: { userId },
      select: { id: true, type: true, optedIn: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscribedMarketing: true },
    });

    return NextResponse.json({
      preferences: updatedPreferences,
      marketingEmails: user?.subscribedMarketing ?? true,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuthRequired(getPreferences);
export const PATCH = withAuthRequired(updatePreferences);
