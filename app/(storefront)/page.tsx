import HeroSection from '@/components/home/HeroSection';
import TrustBadges from '@/components/home/TrustBadges';
import ShopByCategory from '@/components/home/ShopByCategory';
import BestSellers from '@/components/home/BestSellers';
import ShopByAge from '@/components/home/ShopByAge';
import HowItWorks from '@/components/home/HowItWorks';
import BrandStory from '@/components/home/BrandStory';
import GalleryPreview from '@/components/home/GalleryPreview';
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel';
import NewsletterSignup from '@/components/home/NewsletterSignup';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBadges />
      <BestSellers />
      <ShopByCategory />
      <ShopByAge />
      <HowItWorks />
      <BrandStory />
      <GalleryPreview />
      <TestimonialsCarousel />
      <NewsletterSignup />
    </>
  );
}
