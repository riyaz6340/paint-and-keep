/**
 * Paint & Keep - User Registration API
 *
 * POST /api/auth/register
 *
 * Creates a new user account with email/password authentication.
 * Validates input, hashes password with bcrypt (cost factor 12),
 * generates a verification token with 24-hour expiry, and sends
 * a verification email via the notification service.
 *
 * The account remains inactive (isActive=false, emailVerified=false)
 * until the user clicks the verification link.
 *
 * Rate limited to 5 requests per minute per IP.
 *
 * Requirements: 13.1, 13.2, 26.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';
import { handleApiError, badRequest, conflict } from '@/lib/api-error';
import { createRateLimiter } from '@/lib/rate-limit';
import { sendNotificationAsync } from '@/lib/notifications';

// Rate limiter: 5 requests per 60 seconds per IP
const rateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSizeSeconds: 60,
  keyPrefix: 'rl:auth:register',
});

// Bcrypt cost factor
const BCRYPT_COST_FACTOR = 12;

// Verification token expiry: 24 hours in milliseconds
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const body = await request.json();
    const { email, password, name } = body;

    // Validate email
    const emailValidation = validateEmail(email || '');
    if (!emailValidation.valid) {
      throw badRequest(emailValidation.error!, { field: 'email' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password || '');
    if (!passwordValidation.valid) {
      throw badRequest(passwordValidation.error!, { field: 'password' });
    }

    // Validate name
    const nameValidation = validateName(name || '');
    if (!nameValidation.valid) {
      throw badRequest(nameValidation.error!, { field: 'name' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw conflict('An account with this email already exists');
    }

    // Hash password with bcrypt cost factor 12
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // Generate verification token (32 bytes = 64 hex characters)
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    // Create user with inactive status
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        provider: 'EMAIL',
        emailVerified: false,
        isActive: false,
        verificationToken,
        verificationExpiry,
      },
    });

    // Send verification email asynchronously (fire-and-forget)
    sendNotificationAsync({
      type: 'EMAIL_VERIFICATION',
      recipient: normalizedEmail,
      recipientId: user.id,
      data: {
        customerName: user.name,
        verificationToken,
      },
    });

    // Return success response (don't expose user ID or token)
    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
