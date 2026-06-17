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

interface ShippingUpdateEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  status: 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered';
  estimatedDelivery?: string;
  trackingUrl?: string;
}

const statusMessages: Record<string, string> = {
  shipped: 'Your order has been shipped!',
  in_transit: 'Your order is on its way!',
  out_for_delivery: 'Your order is out for delivery!',
  delivered: 'Your order has been delivered!',
};

const statusEmojis: Record<string, string> = {
  shipped: '📦',
  in_transit: '🚚',
  out_for_delivery: '🏠',
  delivered: '✅',
};

export function ShippingUpdateEmail({
  customerName,
  orderNumber,
  trackingNumber,
  carrier,
  status,
  estimatedDelivery,
  trackingUrl,
}: ShippingUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            {statusEmojis[status]} {statusMessages[status]}
          </Heading>

          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Here&apos;s an update on your order <strong>{orderNumber}</strong>.
          </Text>

          <Section style={trackingSection}>
            <Text style={trackingLabel}>Carrier</Text>
            <Text style={trackingValue}>{carrier}</Text>
            <Text style={trackingLabel}>Tracking Number</Text>
            <Text style={trackingValue}>{trackingNumber}</Text>
            <Text style={trackingLabel}>Status</Text>
            <Text style={trackingValue}>
              {statusMessages[status].replace('!', '')}
            </Text>
            {estimatedDelivery && (
              <>
                <Text style={trackingLabel}>Estimated Delivery</Text>
                <Text style={trackingValue}>{estimatedDelivery}</Text>
              </>
            )}
          </Section>

          {trackingUrl && (
            <Section style={ctaSection}>
              <Link href={trackingUrl} style={ctaButton}>
                Track Package
              </Link>
            </Section>
          )}

          <Hr style={divider} />
          <Text style={footer}>
            Paint & Keep — Less Screen Time. More Creative Time.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ShippingUpdateEmail;

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

const trackingSection = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
};

const trackingLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const trackingValue = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '4px 0 12px',
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
