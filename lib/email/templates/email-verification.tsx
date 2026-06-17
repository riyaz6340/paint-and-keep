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

interface EmailVerificationProps {
  customerName: string;
  verificationUrl: string;
}

export function EmailVerificationEmail({
  customerName,
  verificationUrl,
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Verify Your Email 🎨</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Welcome to Paint & Keep! Please verify your email address to
            activate your account and start your creative journey.
          </Text>

          <Section style={ctaSection}>
            <Link href={verificationUrl} style={ctaButton}>
              Verify Email Address
            </Link>
          </Section>

          <Text style={smallText}>
            This link expires in <strong>24 hours</strong>. If you didn&apos;t
            create an account with Paint & Keep, you can safely ignore this
            email.
          </Text>

          <Text style={smallText}>
            If the button doesn&apos;t work, copy and paste this link into your
            browser:
          </Text>
          <Text style={linkText}>{verificationUrl}</Text>

          <Hr style={divider} />
          <Text style={footer}>
            Paint & Keep — Less Screen Time. More Creative Time.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailVerificationEmail;

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

const linkText = {
  fontSize: '12px',
  color: '#7c3aed',
  wordBreak: 'break-all' as const,
  margin: '0 0 12px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#7c3aed',
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
