/**
 * Paint & Keep - Admin Login API
 *
 * POST /api/admin/auth/login
 *
 * Authenticates an admin user with email/password credentials.
 * Validates against the Admin model, creates a session with the admin's role.
 * Rate limited to 5 requests per minute per IP.
 *
 * Requirements: 14.1, 14.8
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/validation';
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error';
import { ApiError } from '@/lib/api-error';
import { createRateLimiter } from '@/lib/rate-limit';
import { createSession } from '@/lib/session';

// Rate limiter: 5 requests per 60 seconds per IP (stricter for admin)
const rateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSizeSeconds: 60,
  keyPrefix: 'rl:admin:login',
});

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

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      throw unauthorized('Invalid email or password');
    }

    // Check if admin account is active
    if (!admin.isActive) {
      throw new ApiError({
        code: 'ACCOUNT_DISABLED',
        message: 'This admin account has been disabled. Please contact a super admin.',
        statusCode: 403,
        retryable: false,
      });
    }

    // Verify password with bcrypt
    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      throw unauthorized('Invalid email or password');
    }

    // Map AdminRole enum to session role string
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'super_admin',
      OPERATIONS: 'operations',
      MARKETING: 'marketing',
      CUSTOMER_SUPPORT: 'customer_support',
    };

    const sessionRole = roleMap[admin.role] || 'admin';

    // Create session with admin role and name in metadata
    const sessionToken = await createSession({
      userId: admin.id,
      role: sessionRole as 'admin' | 'super_admin' | 'operations' | 'marketing' | 'customer_support',
      email: admin.email,
      metadata: { name: admin.name, adminRole: admin.role },
    });

    if (!sessionToken) {
      throw new ApiError({
        code: 'SESSION_ERROR',
        message: 'Failed to create session. Please try again.',
        statusCode: 500,
        retryable: true,
      });
    }

    // Build response with admin profile
    const adminProfile = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    // Create response with session cookie
    const response = NextResponse.json(
      {
        message: 'Admin login successful',
        admin: adminProfile,
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
