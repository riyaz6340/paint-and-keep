/**
 * Paint & Keep - Newsletter API Route
 *
 * POST /api/newsletter - Subscribe to newsletter
 *
 * Requirements: 2.9, 2.10, 2.11
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, badRequest } from '@/lib/api-error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw badRequest('Name is required');
    }
    if (name.length > 100) {
      throw badRequest('Name must be 100 characters or less');
    }

    // Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw badRequest('Email is required');
    }
    if (!EMAIL_REGEX.test(email)) {
      throw badRequest('Please enter a valid email address');
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { success: true, message: 'You are already subscribed!' },
          { status: 200 }
        );
      }
      // Reactivate subscription
      await prisma.newsletterSubscriber.update({
        where: { email: email.trim().toLowerCase() },
        data: { isActive: true, name: name.trim() },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
      });
    }

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to the newsletter!' },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
