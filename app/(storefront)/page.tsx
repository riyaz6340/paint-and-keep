import HeroSection from '@/components/home/HeroSection';
import FeatureCards from '@/components/home/FeatureCards';
import BestSellers from '@/components/home/BestSellers';
import HowItWorks from '@/components/home/HowItWorks';
import GalleryPreview from '@/components/home/GalleryPreview';
import InstagramPreview from '@/components/home/InstagramPreview';
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel';
import NewsletterSignup from '@/components/home/NewsletterSignup';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureCards />
      <BestSellers />
      <HowItWorks />
      <GalleryPreview />
      <InstagramPreview />
      <TestimonialsCarousel />
      <NewsletterSignup />
    </>
  );
}
