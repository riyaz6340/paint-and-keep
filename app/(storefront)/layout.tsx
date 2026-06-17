import Header from '@/components/layout/Header';

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main id="main-content" role="main">
        {children}
      </main>
    </>
  );
}
