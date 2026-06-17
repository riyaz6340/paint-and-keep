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

interface BadgeEarnedEmailProps {
  customerName: string;
  badgeName: string;
  badgeDescription: string;
  profileUrl: string;
}

export function BadgeEarnedEmail({
  customerName,
  badgeName,
  badgeDescription,
  profileUrl,
}: BadgeEarnedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You Earned a Badge! 🏆</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Congratulations! You&apos;ve just earned a new badge for your
            creative achievements.
          </Text>

          <Section style={badgeSection}>
            <Text style={badgeNameStyle}>{badgeName}</Text>
            <Text style={badgeDescriptionStyle}>{badgeDescription}</Text>
          </Section>

          <Text style={paragraph}>
            Keep creating and exploring to earn more badges. Your collection is
            growing!
          </Text>

          <Section style={ctaSection}>
            <Link href={profileUrl} style={ctaButton}>
              View Your Badges
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Paint & Keep — Less Screen Time. More Creative Time.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BadgeEarnedEmail;

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

const badgeSection = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const badgeNameStyle = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#92400e',
  margin: '0 0 8px',
};

const badgeDescriptionStyle = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const ctaButton = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
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
