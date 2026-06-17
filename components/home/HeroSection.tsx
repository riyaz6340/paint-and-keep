'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';

/* ─── Floating animation elements (paint drops & brush strokes) ─── */

const floatingVariants: Variants = {
  animate: {
    y: [0, -20, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const paintDropVariants: Variants = {
  animate: {
    y: [0, 12, 0],
    scale: [1, 1.15, 1],
    opacity: [1, 0.75, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const brushStrokeVariants: Variants = {
  animate: {
    rotate: [-3, 3, -3],
    x: [0, 8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/* ─── Hero images config ─── */

const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    alt: 'Children happily painting colorful figurines together',
    className: 'col-span-2 row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&q=80',
    alt: 'Colorful birthday painting kits arranged for a party',
    className: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
    alt: 'Beautifully finished painted artwork by children',
    className: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    alt: 'Family enjoying a painting session together',
    className: 'col-span-2 row-span-1',
  },
];

/* ─── Component ─── */

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms based on scroll
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const floatingScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <section
      ref={sectionRef}
      aria-label="Hero section"
      className="relative min-h-screen w-full overflow-hidden bg-brand-light"
    >
      {/* ─── Animated paint splash background ─── */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ y: backgroundY }}
      >
        {/* Large gradient blob - top left */}
        <motion.div
          className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-blob bg-gradient-to-br from-brand-primary/20 via-brand-highlight/15 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Medium gradient blob - top right */}
        <motion.div
          className="absolute -right-10 top-20 h-[400px] w-[400px] rounded-blob bg-gradient-to-bl from-brand-secondary/15 via-brand-accent/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        {/* Bottom blob */}
        <motion.div
          className="absolute -bottom-32 left-1/3 h-[350px] w-[600px] rounded-blob bg-gradient-to-t from-brand-accent/10 via-brand-highlight/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
      </motion.div>

      {/* ─── Floating paint drops (animation 1) ─── */}
      <motion.div
        className="pointer-events-none absolute left-[10%] top-[15%] z-10"
        variants={paintDropVariants}
        animate="animate"
        whileHover={{ scale: 1.3, rotate: 15 }}
        style={{ scale: floatingScale }}
      >
        <svg width="40" height="56" viewBox="0 0 40 56" fill="none" aria-hidden="true">
          <path
            d="M20 0C20 0 40 28 40 38C40 48.5 31 56 20 56C9 56 0 48.5 0 38C0 28 20 0 20 0Z"
            fill="#FF6B35"
            fillOpacity="0.7"
          />
        </svg>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute right-[15%] top-[25%] z-10"
        variants={paintDropVariants}
        animate="animate"
        whileHover={{ scale: 1.3, rotate: -10 }}
        style={{ scale: floatingScale }}
        transition={{ delay: 0.5 }}
      >
        <svg width="28" height="40" viewBox="0 0 40 56" fill="none" aria-hidden="true">
          <path
            d="M20 0C20 0 40 28 40 38C40 48.5 31 56 20 56C9 56 0 48.5 0 38C0 28 20 0 20 0Z"
            fill="#7B2D8B"
            fillOpacity="0.6"
          />
        </svg>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute bottom-[30%] left-[5%] z-10"
        variants={paintDropVariants}
        animate="animate"
        whileHover={{ scale: 1.4, rotate: 20 }}
        style={{ scale: floatingScale }}
        transition={{ delay: 0.8 }}
      >
        <svg width="24" height="34" viewBox="0 0 40 56" fill="none" aria-hidden="true">
          <path
            d="M20 0C20 0 40 28 40 38C40 48.5 31 56 20 56C9 56 0 48.5 0 38C0 28 20 0 20 0Z"
            fill="#00BFA6"
            fillOpacity="0.6"
          />
        </svg>
      </motion.div>

      {/* ─── Floating brush strokes (animation 2) ─── */}
      <motion.div
        className="pointer-events-none absolute bottom-[20%] right-[8%] z-10"
        variants={brushStrokeVariants}
        animate="animate"
        whileHover={{ scale: 1.2, rotate: 15 }}
        style={{ scale: floatingScale }}
      >
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none" aria-hidden="true">
          <path
            d="M2 12C2 12 20 2 40 8C60 14 78 4 78 4"
            stroke="#FFD166"
            strokeWidth="6"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
        </svg>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-[20%] top-[60%] z-10"
        variants={brushStrokeVariants}
        animate="animate"
        whileHover={{ scale: 1.2, rotate: -10 }}
        style={{ scale: floatingScale }}
        transition={{ delay: 0.6 }}
      >
        <svg width="60" height="20" viewBox="0 0 80 24" fill="none" aria-hidden="true">
          <path
            d="M2 18C2 18 25 6 45 12C65 18 78 8 78 8"
            stroke="#FF6B35"
            strokeWidth="5"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
        </svg>
      </motion.div>

      {/* ─── Floating decorative elements (animation 3) ─── */}
      <motion.div
        className="pointer-events-none absolute right-[25%] top-[70%] z-10"
        variants={floatingVariants}
        animate="animate"
        whileHover={{ scale: 1.3 }}
        style={{ scale: floatingScale }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="#9B5DE5" fillOpacity="0.4" />
        </svg>
      </motion.div>

      {/* ─── Main content ─── */}
      <motion.div
        className="relative z-20 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-16 sm:px-6 lg:flex-row lg:gap-12 lg:px-8 lg:py-20"
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
            LESS SCREEN TIME.{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              MORE CREATIVE TIME.
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-lg text-text-secondary sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            Discover ready-to-paint creative kits that spark imagination, build
            confidence, and bring families together.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            <Link href="/shop">
              <motion.span
                className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-button transition-colors hover:bg-brand-primary/90"
                whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Shop Now
              </motion.span>
            </Link>

            <Link href="/birthday-packages">
              <motion.span
                className="inline-flex items-center justify-center rounded-2xl bg-brand-secondary px-8 py-4 text-lg font-semibold text-white shadow-button transition-colors hover:bg-brand-secondary/90"
                whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(123, 45, 139, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Birthday Packages
              </motion.span>
            </Link>

            <a href="#testimonials">
              <motion.span
                className="inline-flex items-center justify-center rounded-2xl border-2 border-brand-accent bg-white px-8 py-4 text-lg font-semibold text-brand-accent shadow-card transition-colors hover:bg-brand-accent hover:text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Watch Happy Moments
              </motion.span>
            </a>
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
            {heroImages.map((image, index) => (
              <motion.div
                key={image.src}
                className={`relative overflow-hidden rounded-2xl shadow-card ${image.className}`}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(45, 48, 71, 0.15)' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.4 + index * 0.15,
                  ease: 'easeOut',
                }}
              >
                <div
                  className={`relative w-full ${
                    index === 0 ? 'h-48 sm:h-64 lg:h-72' : 'h-24 sm:h-32 lg:h-36'
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                  {/* Colored overlay for a painterly effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/10 to-transparent" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Scroll indicator ─── */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-brand-dark/50"
          aria-hidden="true"
        >
          <path
            d="M12 5v14M5 12l7 7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </section>
  );
}
