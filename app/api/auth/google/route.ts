/**
 * Paint & Keep - Google OAuth Authentication Endpoint
 *
 * Accepts a Google ID token (credential), verifies it using
 * Google's OAuth2Client, creates or retrieves the user, and
 * returns a session token.
 *
 * Requirements: 13.1 (Google OAuth login/registration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

import prisma from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { createRateLimiter } from '@/lib/rate-limit';
import { badRequest, handleApiError, internalError, unauthorized } from '@/lib/api-error';

/** Rate limit: 10 requests per minute per IP */
const rateLimiter = createRateLimiter({
  maxRequests: 10,
  windowSizeSeconds: 60,
  keyPrefix: 'rl:auth:google',
});

/** Google OAuth2 client for token verification */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const body = await request.json();
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      throw badRequest('Missing or invalid credential token');
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw unauthorized('Invalid Google token: missing email');
    }

    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      throw unauthorized('Google email is not verified');
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Existing user: update last login timestamp
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          updatedAt: new Date(),
          // Reset failed login attempts on successful Google login
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    } else {
      // New user: create with Google provider
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          profileImage: picture || null,
          provider: 'GOOGLE',
          emailVerified: true,
          isActive: true,
        },
      });
    }

    // Create session
    const sessionToken = await createSession({
      userId: user.id,
      role: 'customer',
      email: user.email,
    });

    if (!sessionToken) {
      throw internalError('Failed to create session');
    }

    // Build response with session token
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        },
        sessionToken,
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
    // Handle Google token verification errors specifically
    if (error instanceof Error && error.message.includes('Token used too late')) {
      return handleApiError(unauthorized('Google token has expired'));
    }
    if (error instanceof Error && error.message.includes('Invalid token')) {
      return handleApiError(unauthorized('Invalid Google token'));
    }

    return handleApiError(error);
  }
}
