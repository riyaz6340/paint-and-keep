import { Resend } from 'resend';

/**
 * Resend email client singleton
 * Configured via RESEND_API_KEY environment variable.
 * Lazily initialized — only throws when actually used without a key.
 */

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

function getResendClient(): Resend {
  if (globalForResend.resend) {
    return globalForResend.resend;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Return a stub that logs warnings instead of crashing the build
    console.warn(
      'RESEND_API_KEY not set — email sending is disabled. ' +
        'Add it to your .env.local file to enable emails.'
    );
    // Return a Resend instance with empty key — calls will fail gracefully at runtime
    const stub = new Resend('re_placeholder');
    return stub;
  }

  const client = new Resend(apiKey);

  if (process.env.NODE_ENV !== 'production') {
    globalForResend.resend = client;
  }

  return client;
}

/** Lazily initialized Resend client. Use `getResend()` for guaranteed fresh instance. */
export const resend = getResendClient();

/** Get the Resend client (lazy initialization) */
export function getResend(): Resend {
  return getResendClient();
}

/** Default sender email address */
export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'noreply@paintandkeep.com';

/** Site URL for constructing links in emails */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
