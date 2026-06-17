import type { Metadata } from 'next';
import ReturnGiftsClient from './ReturnGiftsClient';

export const metadata: Metadata = {
  title: 'Return Gifts – Creative Paint Kits for Birthday Parties | Paint & Keep',
  description:
    'Order unique return gift bundles for birthday parties. Paint & Keep kits are creative, eco-friendly, and kids love them. Bulk discounts on 10, 20, and 30 kit packs.',
};

export default function ReturnGiftsPage() {
  return <ReturnGiftsClient />;
}
