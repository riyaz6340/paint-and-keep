import Header from '@/components/layout/Header';
import PromoBanner from '@/components/home/PromoBanner';

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PromoBanner />
      <Header />
      <main id="main-content" role="main">
        {children}
      </main>
    </>
  );
}
