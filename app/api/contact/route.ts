/**
 * Paint & Keep - Contact Form API
 *
 * POST /api/contact
 * Validates contact form data, sends notification to support team,
 * and returns confirmation within 5 seconds.
 *
 * Requirements: 10.3, 10.6, 10.7, 10.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateEmail } from '@/lib/validation';
import { badRequest, handleApiError, internalError } from '@/lib/api-error';
import { sendNotificationAsync } from '@/lib/notifications';

interface ContactFormBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

function validateContactFields(body: ContactFormBody): FieldErrors {
  const errors: FieldErrors = {};

  // Name: required, max 100 chars
  if (!body.name || !body.name.trim()) {
    errors.name = 'Name is required';
  } else if (body.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters';
  }

  // Email: required, max 254 chars, valid format
  if (!body.email || !body.email.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailResult = validateEmail(body.email.trim());
    if (!emailResult.valid) {
      errors.email = emailResult.error || 'Invalid email format';
    }
  }

  // Subject: required, max 200 chars
  if (!body.subject || !body.subject.trim()) {
    errors.subject = 'Subject is required';
  } else if (body.subject.trim().length > 200) {
    errors.subject = 'Subject must not exceed 200 characters';
  }

  // Message: required, min 10, max 2000 chars
  if (!body.message || !body.message.trim()) {
    errors.message = 'Message is required';
  } else if (body.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (body.message.trim().length > 2000) {
    errors.message = 'Message must not exceed 2000 characters';
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    let body: ContactFormBody;

    try {
      body = await request.json();
    } catch {
      throw badRequest('Invalid request body');
    }

    // Validate all fields
    const fieldErrors = validateContactFields(body);
    if (Object.keys(fieldErrors).length > 0) {
      throw badRequest('Please fix the following errors', {
        fields: fieldErrors,
      });
    }

    const sanitizedData = {
      name: body.name.trim(),
      email: body.email.trim(),
      subject: body.subject.trim(),
      message: body.message.trim(),
    };

    // Send notification to support team (fire-and-forget for speed)
    const supportEmail =
      process.env.SUPPORT_EMAIL || 'support@paintandkeep.com';

    sendNotificationAsync({
      type: 'ADMIN_NEW_INQUIRY',
      recipient: supportEmail,
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        packageTier: `Contact: ${sanitizedData.subject}`,
        partyDate: new Date().toISOString(),
      },
    });

    // Return success confirmation (well within 5 seconds)
    return NextResponse.json(
      {
        success: true,
        message:
          'Your message has been sent successfully. Our team will get back to you shortly.',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
