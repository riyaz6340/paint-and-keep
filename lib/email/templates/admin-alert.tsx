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

type AdminAlertType = 'new_order' | 'low_stock' | 'new_inquiry';

interface AdminAlertEmailProps {
  alertType: AdminAlertType;
  title: string;
  details: Record<string, string>;
  actionUrl: string;
  actionLabel: string;
}

const alertEmojis: Record<AdminAlertType, string> = {
  new_order: '🛒',
  low_stock: '⚠️',
  new_inquiry: '📩',
};

export function AdminAlertEmail({
  alertType,
  title,
  details,
  actionUrl,
  actionLabel,
}: AdminAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            {alertEmojis[alertType]} {title}
          </Heading>

          <Section style={detailsSection}>
            {Object.entries(details).map(([key, value]) => (
              <React.Fragment key={key}>
                <Text style={detailLabel}>{key}</Text>
                <Text style={detailValue}>{value}</Text>
              </React.Fragment>
            ))}
          </Section>

          <Section style={ctaSection}>
            <Link href={actionUrl} style={ctaButton}>
              {actionLabel}
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Paint & Keep Admin — This is an automated notification.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AdminAlertEmail;

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
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const detailsSection = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
};

const detailLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const detailValue = {
  fontSize: '15px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '4px 0 12px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const ctaButton = {
  backgroundColor: '#dc2626',
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
