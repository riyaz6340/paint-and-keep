import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from '@react-email/components';

interface AccountLockoutEmailProps {
  customerName: string;
  lockoutDuration: string;
  resetUrl: string;
}

export function AccountLockoutEmail({
  customerName,
  lockoutDuration,
  resetUrl,
}: AccountLockoutEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Account Temporarily Locked 🔒</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Your account has been temporarily locked due to multiple failed login
            attempts. This is a security measure to protect your account.
          </Text>

          <Text style={paragraph}>
            Your account will be automatically unlocked after{' '}
            <strong>{lockoutDuration}</strong>.
          </Text>

          <Text style={paragraph}>
            If this wasn&apos;t you, we recommend resetting your password
            immediately:
          </Text>

          <Section style={ctaSection}>
            <Link href={resetUrl} style={ctaButton}>
              Reset Password
            </Link>
          </Section>

          <Text style={smallText}>
            If you didn&apos;t attempt to log in, someone may be trying to
            access your account. Please reset your password to secure your
            account.
          </Text>

          <Hr style={divider} />
          <Text style={footer}>
            Paint &amp; Keep — Less Screen Time. More Creative Time.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AccountLockoutEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4a4a4a',
  margin: '0 0 12px',
};

const smallText = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '0 0 8px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0',
};
