/**
 * Paint & Keep - User Login API
 *
 * POST /api/auth/login
 *
 * Authenticates a user with email/password credentials.
 * Implements rate limiting (10 requests/minute per IP),
 * account lockout after 5 consecutive failed attempts (15-minute lockout),
 * single active session enforcement, and lockout notification emails.
 *
 * Requirements: 13.1, 13.3, 26.4, 26.5, 26.9
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { render } from '@react-email/components';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/validation';
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error';
import { ApiError } from '@/lib/api-error';
import { createRateLimiter } from '@/lib/rate-limit';
import { createSession, destroyAllUserSessions } from '@/lib/session';
import { resend, EMAIL_FROM, SITE_URL } from '@/lib/email/resend';
import { AccountLockoutEmail } from '@/lib/email/templates/account-lockout';

// Rate limiter: 10 requests per 60 seconds per IP
const rateLimiter = createRateLimiter({
  maxRequests: 10,
  windowSizeSeconds: 60,
  keyPrefix: 'rl:auth:login',
});

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validate email presence and format
    const emailValidation = validateEmail(email || '');
    if (!emailValidation.valid) {
      throw badRequest(emailValidation.error!, { field: 'email' });
    }

    // Validate password presence
    if (!password || typeof password !== 'string') {
      throw badRequest('Password is required', { field: 'password' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return generic error to prevent email enumeration
      throw unauthorized('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      throw new ApiError({
        code: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
        statusCode: 423,
        details: { retryAfter: Math.ceil(remainingMs / 1000) },
        retryable: true,
      });
    }

    // Check if user has a password (could be Google-only account)
    if (!user.passwordHash) {
      throw unauthorized('Invalid email or password');
    }

    // Verify password with bcrypt
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      // Increment failed login attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: newAttempts,
      };

      // Lock account if threshold reached
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        updateData.lockedUntil = lockedUntil;

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // Send lockout notification email (fire-and-forget)
        sendLockoutNotification(user.email, user.name);

        throw new ApiError({
          code: 'ACCOUNT_LOCKED',
          message: 'Account has been locked due to too many failed login attempts. Please try again in 15 minutes.',
          statusCode: 423,
          details: { retryAfter: LOCKOUT_DURATION_MS / 1000 },
          retryable: true,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw unauthorized('Invalid email or password');
    }

    // Password is valid — check account status

    // Check if account is disabled by admin (not the same as unverified)
    if (!user.isActive && user.emailVerified) {
      throw new ApiError({
        code: 'ACCOUNT_DISABLED',
        message: 'This account has been disabled. Please contact support.',
        statusCode: 403,
        retryable: false,
      });
    }

    // Auto-activate account on first successful login
    if (!user.isActive || !user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true, emailVerified: true },
      });
    }

    // Reset failed login attempts on successful authentication
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all previous sessions (single active session)
    await destroyAllUserSessions(user.id);

    // Create new session
    const sessionToken = await createSession({
      userId: user.id,
      role: 'customer',
      email: user.email,
    });

    if (!sessionToken) {
      throw new ApiError({
        code: 'SESSION_ERROR',
        message: 'Failed to create session. Please try again.',
        statusCode: 500,
        retryable: true,
      });
    }

    // Build response with user profile
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
    };

    // Create response with session cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userProfile,
        token: sessionToken,
      },
      { status: 200 }
    );

    // Set session token as httpOnly cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60, // 30 minutes (matches session TTL)
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Send account lockout notification email.
 * Fire-and-forget — errors are logged but do not affect the response.
 */
async function sendLockoutNotification(
  email: string,
  customerName: string
): Promise<void> {
  try {
    const resetUrl = `${SITE_URL}/forgot-password`;
    const html = await render(
      AccountLockoutEmail({
        customerName,
        lockoutDuration: '15 minutes',
        resetUrl,
      })
    );

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Account Locked — Paint & Keep',
      html,
    });
  } catch (error) {
    console.error('[Login] Failed to send lockout notification:', error);
  }
}
