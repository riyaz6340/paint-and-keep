/**
 * Paint & Keep - Birthday Inquiry API
 *
 * POST /api/birthday-inquiry
 * Validates birthday inquiry form data, saves to database,
 * sends confirmation email to customer, and notifies admin team.
 *
 * Requirements: 5.3, 5.4, 5.5, 5.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, validatePhone, validateName } from '@/lib/validation';
import { badRequest, handleApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { sendNotificationAsync } from '@/lib/notifications';
import { PackageTier } from '@prisma/client';

/* ─── Types ─── */

interface BirthdayInquiryBody {
  name: string;
  phone: string;
  email: string;
  partyDate: string;
  numberOfChildren: number;
  packageTier: string;
  theme: string;
  message?: string;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  partyDate?: string;
  numberOfChildren?: string;
  theme?: string;
  message?: string;
}

/* ─── Available themes for validation ─── */

const VALID_THEMES = [
  'Animals',
  'Cartoon Characters',
  'Fantasy & Unicorns',
  'Superheroes',
  'Princess & Fairy',
  'Under the Sea',
  'Dinosaurs',
  'Space & Planets',
  'Rainbow & Colors',
  'Nature & Flowers',
];

/* ─── Valid package tier values ─── */

const VALID_PACKAGE_TIERS: Record<string, PackageTier> = {
  STARTER_10: 'STARTER_10',
  POPULAR_20: 'POPULAR_20',
  MEGA_50: 'MEGA_50',
};

/* ─── Validation ─── */

function validateInquiryFields(body: BirthdayInquiryBody): FieldErrors {
  const errors: FieldErrors = {};

  // Name: required, max 100 chars
  const nameResult = validateName(body.name, 100);
  if (!nameResult.valid) {
    errors.name = nameResult.error;
  }

  // Phone: required, valid E.164 format
  const phoneResult = validatePhone(body.phone);
  if (!phoneResult.valid) {
    errors.phone = phoneResult.error;
  }

  // Email: required, valid format
  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  // Party Date: required, at least 7 days in the future
  if (!body.partyDate) {
    errors.partyDate = 'Party date is required';
  } else {
    const selectedDate = new Date(body.partyDate);
    if (isNaN(selectedDate.getTime())) {
      errors.partyDate = 'Invalid date format';
    } else {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7);
      minDate.setHours(0, 0, 0, 0);
      if (selectedDate < minDate) {
        errors.partyDate = 'Party date must be at least 7 days from today';
      }
    }
  }

  // Number of Children: required, 1-50
  if (body.numberOfChildren === null || body.numberOfChildren === undefined) {
    errors.numberOfChildren = 'Number of children is required';
  } else {
    const num = Number(body.numberOfChildren);
    if (isNaN(num) || !Number.isInteger(num)) {
      errors.numberOfChildren = 'Number of children must be a whole number';
    } else if (num < 1) {
      errors.numberOfChildren = 'Number of children must be at least 1';
    } else if (num > 50) {
      errors.numberOfChildren = 'Number of children must not exceed 50';
    }
  }

  // Theme: required, must be from available options
  if (!body.theme) {
    errors.theme = 'Please select a theme';
  } else if (!VALID_THEMES.includes(body.theme)) {
    errors.theme = 'Please select a valid theme from the available options';
  }

  // Message: optional, max 500 chars
  if (body.message && body.message.length > 500) {
    errors.message = 'Message must not exceed 500 characters';
  }

  return errors;
}

/* ─── Route Handler ─── */

export async function POST(request: NextRequest) {
  try {
    let body: BirthdayInquiryBody;

    try {
      body = await request.json();
    } catch {
      throw badRequest('Invalid request body');
    }

    // Validate all fields
    const fieldErrors = validateInquiryFields(body);
    if (Object.keys(fieldErrors).length > 0) {
      throw badRequest('Please fix the following errors', {
        fields: fieldErrors,
      });
    }

    // Resolve package tier
    const packageTier = VALID_PACKAGE_TIERS[body.packageTier] || 'STARTER_10';

    // Save inquiry to database
    const inquiry = await prisma.birthdayInquiry.create({
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email.trim(),
        partyDate: new Date(body.partyDate),
        numberOfChildren: Number(body.numberOfChildren),
        packageTier,
        theme: body.theme,
        message: body.message?.trim() || null,
      },
    });

    // Send confirmation email to customer (Requirement 5.4)
    sendNotificationAsync({
      type: 'BIRTHDAY_INQUIRY_CONFIRMATION',
      recipient: body.email.trim(),
      data: {
        customerName: body.name.trim(),
        partyDate: body.partyDate,
        packageTier: tierDisplayName(packageTier),
        numberOfChildren: String(body.numberOfChildren),
      },
    });

    // Notify admin team (Requirement 5.6)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@paintandkeep.com';
    sendNotificationAsync({
      type: 'ADMIN_NEW_INQUIRY',
      recipient: adminEmail,
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        packageTier: tierDisplayName(packageTier),
        partyDate: body.partyDate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your birthday inquiry has been submitted successfully. Check your email for confirmation!',
        inquiryId: inquiry.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/* ─── Helper ─── */

function tierDisplayName(tier: PackageTier): string {
  switch (tier) {
    case 'STARTER_10':
      return 'Starter Pack (10 Kids)';
    case 'POPULAR_20':
      return 'Popular Pack (20 Kids)';
    case 'MEGA_50':
      return 'Mega Pack (50 Kids)';
    default:
      return tier;
  }
}
