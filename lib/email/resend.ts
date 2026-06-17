import { Resend } from 'resend';

/**
 * Resend email client singleton
 * Configured via RESEND_API_KEY environment variable
 */

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

function createResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is not set. ' +
        'Please add it to your .env.local file.'
    );
  }

  return new Resend(apiKey);
}

export const resend = globalForResend.resend ?? createResendClient();

if (process.env.NODE_ENV !== 'production') {
  globalForResend.resend = resend;
}

/** Default sender email address */
export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'noreply@paintandkeep.com';

/** Site URL for constructing links in emails */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
