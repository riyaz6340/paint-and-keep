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
  Row,
  Column,
  Link,
} from '@react-email/components';

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  estimatedDelivery: string;
  orderUrl: string;
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  subtotal,
  discount,
  shippingCost,
  total,
  estimatedDelivery,
  orderUrl,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Order Confirmed! 🎨</Heading>
          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Thank you for your order! We&apos;re excited to get your creative
            kit on its way.
          </Text>

          <Section style={orderInfoSection}>
            <Text style={orderLabel}>Order Number</Text>
            <Text style={orderValue}>{orderNumber}</Text>
            <Text style={orderLabel}>Estimated Delivery</Text>
            <Text style={orderValue}>{estimatedDelivery}</Text>
          </Section>

          <Hr style={divider} />

          <Heading as="h3" style={subheading}>
            Order Summary
          </Heading>

          {items.map((item, index) => (
            <Row key={index} style={itemRow}>
              <Column style={itemName}>
                {item.name} × {item.quantity}
              </Column>
              <Column style={itemPrice}>
                ₹{(item.unitPrice * item.quantity).toFixed(2)}
              </Column>
            </Row>
          ))}

          <Hr style={divider} />

          <Row style={summaryRow}>
            <Column style={summaryLabel}>Subtotal</Column>
            <Column style={summaryValue}>₹{subtotal.toFixed(2)}</Column>
          </Row>
          {discount > 0 && (
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Discount</Column>
              <Column style={summaryValue}>-₹{discount.toFixed(2)}</Column>
            </Row>
          )}
          <Row style={summaryRow}>
            <Column style={summaryLabel}>Shipping</Column>
            <Column style={summaryValue}>₹{shippingCost.toFixed(2)}</Column>
          </Row>
          <Row style={totalRow}>
            <Column style={summaryLabel}>
              <strong>Total</strong>
            </Column>
            <Column style={summaryValue}>
              <strong>₹{total.toFixed(2)}</strong>
            </Column>
          </Row>

          <Section style={ctaSection}>
            <Link href={orderUrl} style={ctaButton}>
              Track Your Order
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

export default OrderConfirmationEmail;

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

const subheading = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '16px 0 12px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4a4a4a',
  margin: '0 0 12px',
};

const orderInfoSection = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
};

const orderLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const orderValue = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '4px 0 12px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const itemRow = {
  padding: '8px 0',
};

const itemName = {
  fontSize: '14px',
  color: '#4a4a4a',
};

const itemPrice = {
  fontSize: '14px',
  color: '#1a1a1a',
  textAlign: 'right' as const,
};

const summaryRow = {
  padding: '4px 0',
};

const summaryLabel = {
  fontSize: '14px',
  color: '#6b7280',
};

const summaryValue = {
  fontSize: '14px',
  color: '#1a1a1a',
  textAlign: 'right' as const,
};

const totalRow = {
  padding: '8px 0',
  borderTop: '1px solid #e5e7eb',
  marginTop: '8px',
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

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0',
};
