'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';

/* ─── Default hero content (fallback if CMS has no data) ─── */

const defaultHeroImages = [
  {
    src: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    alt: 'Children happily painting colorful figurines together',
  },
  {
    src: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&q=80',
    alt: 'Colorful birthday painting kits arranged for a party',
  },
  {
    src: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
    alt: 'Beautifully finished painted artwork by children',
  },
  {
    src: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    alt: 'Family enjoying a painting session together',
  },
];

const defaultContent = {
  headline: 'LESS SCREEN TIME. MORE CREATIVE TIME.',
  subheadline: 'Discover ready-to-paint creative kits that spark imagination, build confidence, and bring families together.',
  ctas: [
    { label: 'Shop Now', url: '/shop' },
    { label: 'Birthday Packages', url: '/birthday-packages' },
  ],
};

/* ─── Component ─── */

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [heroData, setHeroData] = useState<{
    headline: string;
    subheadline: string;
    images: string[];
    ctas: { label: string; url: string }[];
  } | null>(null);

  // Fetch CMS hero content
  useEffect(() => {
    fetch('/api/admin/cms/hero')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.content?.headline) {
          setHeroData(data.content);
        }
      })
      .catch(() => {});
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Use CMS data or defaults
  const headline = heroData?.headline || defaultContent.headline;
  const subheadline = heroData?.subheadline || defaultContent.subheadline;
  const ctas = heroData?.ctas?.length ? heroData.ctas : defaultContent.ctas;
  const heroImages = heroData?.images?.length
    ? heroData.images.map((url, i) => ({ src: url, alt: `Hero image ${i + 1}` }))
    : defaultHeroImages;

  return (
    <section
      ref={sectionRef}
      aria-label="Hero section"
      className="relative min-h-[80vh] w-full overflow-hidden bg-brand-light"
    >
      {/* ─── Background blobs ─── */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ y: backgroundY }}
      >
        <motion.div
          className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-blob bg-gradient-to-br from-brand-primary/20 via-brand-highlight/15 to-transparent blur-3xl"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-10 top-20 h-[400px] w-[400px] rounded-blob bg-gradient-to-bl from-brand-secondary/15 via-brand-accent/10 to-transparent blur-3xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.div>

      {/* ─── Main content ─── */}
      <motion.div
        className="relative z-20 mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-4 py-16 sm:px-6 lg:flex-row lg:gap-12 lg:px-8 lg:py-20"
        style={{ opacity: contentOpacity }}
      >
        {/* Text content */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <motion.h1
            className="font-heading text-display-lg text-brand-dark sm:text-display-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {headline.includes('.') ? (
              <>
                {headline.split('.')[0]}.{' '}
                <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                  {headline.split('.').slice(1).join('.')}
                </span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                {headline}
              </span>
            )}
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-lg text-text-secondary sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            {subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            {ctas.map((cta, i) => (
              <Link key={cta.url} href={cta.url}>
                <motion.span
                  className={`inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-semibold text-white shadow-button transition-colors ${
                    i === 0
                      ? 'bg-brand-primary hover:bg-brand-primary/90'
                      : 'bg-brand-secondary hover:bg-brand-secondary/90'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {cta.label}
                </motion.span>
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Hero images grid */}
        <motion.div
          className="mt-12 flex-1 lg:mt-0"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {heroImages.slice(0, 4).map((image, index) => (
              <motion.div
                key={image.src}
                className={`relative overflow-hidden rounded-2xl shadow-card ${
                  index === 0 ? 'col-span-2 row-span-2' : index === 3 ? 'col-span-2' : ''
                }`}
                whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
              >
                <div className={`relative w-full ${
                  index === 0 ? 'h-48 sm:h-64 lg:h-72' : 'h-24 sm:h-32 lg:h-36'
                }`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/10 to-transparent" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
