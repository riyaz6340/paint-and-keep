import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito, Pacifico } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const pacifico = Pacifico({
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap',
  weight: '400',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://paintandkeep.com'),
  title: {
    default: 'Paint & Keep | Creative Painting Kits for Kids & Families',
    template: '%s | Paint & Keep',
  },
  description:
    'Discover ready-to-paint creative kits for kids, birthday parties, and families. Less screen time, more creative time. Shop painting kits, birthday packages, and return gifts.',
  keywords: [
    'creative kits for kids',
    'birthday return gifts',
    'painting kits for children',
    'screen free activities',
    'creative birthday party ideas',
    'paint your own figurines',
    'DIY painting kits',
    'creative gifts for kids',
    'birthday activity kits',
    'family activity kits',
  ],
  authors: [{ name: 'Paint & Keep' }],
  creator: 'Paint & Keep',
  publisher: 'Paint & Keep',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Paint & Keep',
    title: 'Paint & Keep | Creative Painting Kits for Kids & Families',
    description:
      'Discover ready-to-paint creative kits for kids, birthday parties, and families. Less screen time, more creative time.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Paint & Keep - Creative Painting Kits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paint & Keep | Creative Painting Kits for Kids & Families',
    description:
      'Discover ready-to-paint creative kits for kids, birthday parties, and families.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#FF6B35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} ${pacifico.variable}`}>
      <body className="min-h-screen bg-brand-light font-body text-text-primary antialiased">
        {/* Skip to main content for accessibility (Requirement 25.6) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
