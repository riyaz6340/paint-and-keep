/**
 * Paint & Keep - Email Verification API
 *
 * GET /api/auth/verify/[token]
 *
 * Confirms a user's email address by validating the verification token.
 * The token must not be expired (24-hour window from registration).
 * On success, sets emailVerified=true, isActive=true, and clears the token.
 *
 * Requirements: 13.1, 13.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, badRequest, notFound } from '@/lib/api-error';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Validate token parameter
    if (!token || token.trim().length === 0) {
      throw badRequest('Verification token is required');
    }

    // Look up user by verification token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw notFound('Invalid or expired verification token');
    }

    // Check if token has expired
    if (!user.verificationExpiry || user.verificationExpiry < new Date()) {
      throw badRequest('Verification token has expired. Please register again.');
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email already verified. You can log in.',
      });
    }

    // Activate the account: set emailVerified and isActive, clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return NextResponse.json({
      message: 'Email verified successfully. Your account is now active.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
