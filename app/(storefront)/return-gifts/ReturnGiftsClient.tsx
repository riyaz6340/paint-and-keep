'use client';

/**
 * ReturnGiftsClient - Interactive Return Gifts page with bundle options,
 * benefits section, Add To Cart functionality, and scroll animations.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Data ─────────────────────────────────────────────────────────────── */

interface Bundle {
  id: string;
  name: string;
  description: string;
  kitQuantity: number;
  pricePerKit: number;
  totalPrice: number;
  available: boolean;
  tag?: string;
}

const bundles: Bundle[] = [
  {
    id: 'bundle-mini-artist',
    name: 'Mini Artist Pack',
    description:
      'Perfect for small celebrations. Each kit includes a pre-sketched canvas, paints, and brushes.',
    kitQuantity: 10,
    pricePerKit: 199,
    totalPrice: 1990,
    available: true,
  },
  {
    id: 'bundle-party-pack',
    name: 'Party Pack',
    description:
      'Our most popular bundle! Great value for medium-sized parties with a variety of designs.',
    kitQuantity: 20,
    pricePerKit: 179,
    totalPrice: 3580,
    available: true,
    tag: 'Most Popular',
  },
  {
    id: 'bundle-mega-celebration',
    name: 'Mega Celebration',
    description:
      'Best value for large parties and school events. Includes mixed themes and difficulty levels.',
    kitQuantity: 30,
    pricePerKit: 159,
    totalPrice: 4770,
    available: false,
  },
];

const benefits = [
  {
    icon: '🎨',
    title: 'Unique & Creative',
    description:
      'Every child takes home a one-of-a-kind painted masterpiece they created themselves.',
  },
  {
    icon: '📦',
    title: 'Ready to Use',
    description:
      'Each kit comes complete with canvas, paints, brushes, and instructions — no extra prep needed.',
  },
  {
    icon: '🤩',
    title: 'Kids Love Them',
    description:
      'Painting is engaging for all ages. Kids stay entertained and parents appreciate the screen-free activity.',
  },
  {
    icon: '🌿',
    title: 'Eco-Friendly Packaging',
    description:
      'Our kits use recyclable materials and non-toxic, washable paints safe for young artists.',
  },
];

const testimonials = [
  {
    quote:
      'The kids at my daughter's party were SO excited! Every single one of them said it was the best return gift ever.',
    name: 'Priya M.',
    event: 'Birthday party for 15 kids',
  },
  {
    quote:
      'I ordered the Party Pack and it arrived beautifully packaged. The kits kept the children busy for over an hour!',
    name: 'Ananya R.',
    event: '7th birthday celebration',
  },
];

/* ─── Animation variants ───────────────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Component ────────────────────────────────────────────────────────── */

export default function ReturnGiftsClient() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Benefits Section — Requirement 6.1 */}
      <BenefitsSection />

      {/* Bundle Options — Requirement 6.2, 6.3, 6.4 */}
      <BundleSection />

      {/* Testimonials / Social Proof */}
      <TestimonialSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}

/* ─── Hero Section ─────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-highlight/20 via-brand-light to-paint-pink/20 py-16 sm:py-24">
      {/* Decorative paint splashes */}
      <div className="paint-splash -top-10 -left-10 w-40 h-40 bg-brand-primary" />
      <div className="paint-splash -bottom-10 -right-10 w-60 h-60 bg-brand-secondary" />
      <div className="paint-splash top-1/2 left-1/3 w-20 h-20 bg-brand-accent" />

      <div className="container-page relative z-10 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p
            variants={fadeInUp}
            className="text-brand-primary font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Return Gifts
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="text-display-md sm:text-display-lg text-brand-dark max-w-3xl mx-auto"
          >
            Make Every Kid Leave with a Smile 🎉
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Surprise party guests with creative paint kits they can enjoy at home.
            Unique, fun, and way better than candy or plastic toys!
          </motion.p>
          <motion.a
            variants={fadeInUp}
            href="#bundles"
            className="btn-primary mt-8 inline-flex items-center gap-2 px-8 py-3 text-base"
          >
            View Bundles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Benefits Section ─────────────────────────────────────────────────── */

function BenefitsSection() {
  return (
    <section className="py-16 sm:py-20 bg-surface" aria-labelledby="benefits-heading">
      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            id="benefits-heading"
            className="text-display-sm sm:text-display-md text-brand-dark"
          >
            Why Paint & Keep Kits?
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-3 text-text-secondary max-w-xl mx-auto">
            The perfect return gift that kids actually use and remember
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={fadeInUp}
              className="card text-center group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-brand-dark mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-text-secondary">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Bundle Section ───────────────────────────────────────────────────── */

function BundleSection() {
  return (
    <section
      id="bundles"
      className="py-16 sm:py-20 bg-gradient-to-b from-surface-secondary to-surface"
      aria-labelledby="bundles-heading"
    >
      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            id="bundles-heading"
            className="text-display-sm sm:text-display-md text-brand-dark"
          >
            Choose Your Bundle
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-3 text-text-secondary max-w-xl mx-auto">
            Bulk discounts on ready-to-paint kits. The more you order, the more you save!
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Bundle Card ──────────────────────────────────────────────────────── */

function BundleCard({ bundle }: { bundle: Bundle }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = useCallback(async () => {
    if (!bundle.available || isLoading) return;

    setIsLoading(true);

    // Simulate cart add (will integrate with cart context/API)
    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsLoading(false);
    setShowConfirmation(true);

    // Hide confirmation within 2 seconds (Requirement 6.3)
    setTimeout(() => {
      setShowConfirmation(false);
    }, 2000);
  }, [bundle.available, isLoading]);

  const isUnavailable = !bundle.available;

  return (
    <motion.div
      variants={fadeInUp}
      className={`relative flex flex-col rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${
        isUnavailable
          ? 'border-surface-tertiary bg-surface-tertiary/50 opacity-70'
          : bundle.tag
            ? 'border-brand-primary bg-surface shadow-card-hover scale-[1.02]'
            : 'border-surface-tertiary bg-surface shadow-card hover:shadow-card-hover hover:border-brand-primary/30'
      }`}
    >
      {/* Tag badge */}
      {bundle.tag && !isUnavailable && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-brand-primary text-white text-xs font-bold px-4 py-1 rounded-full shadow-button">
            {bundle.tag}
          </span>
        </div>
      )}

      {/* Bundle info */}
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-brand-dark">{bundle.name}</h3>
        <p className="mt-2 text-sm text-text-secondary">{bundle.description}</p>

        {/* Pricing details */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Kit Quantity</span>
            <span className="font-semibold text-brand-dark">{bundle.kitQuantity} kits</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Price per Kit</span>
            <span className="font-semibold text-brand-dark">₹{bundle.pricePerKit}</span>
          </div>
          <div className="border-t border-surface-tertiary my-3" />
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Total Price</span>
            <span className="text-2xl font-bold text-brand-primary">
              ₹{bundle.totalPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Add to Cart / Unavailable */}
      <div className="mt-6 relative">
        {isUnavailable ? (
          <div className="text-center">
            <button
              type="button"
              disabled
              className="btn w-full px-6 py-3 text-sm bg-surface-tertiary text-text-muted cursor-not-allowed border border-surface-tertiary"
              aria-label={`${bundle.name} is currently unavailable`}
            >
              Currently Unavailable
            </button>
            <p className="mt-2 text-xs text-status-error font-medium">
              This bundle is currently unavailable
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isLoading}
              className="btn-primary w-full px-6 py-3 text-sm"
              aria-label={`Add ${bundle.name} to cart`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  Add To Cart
                </span>
              )}
            </button>

            {/* Confirmation message — Requirement 6.3 */}
            <AnimatePresence>
              {showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 -bottom-12 z-10 flex items-center justify-center gap-2 rounded-lg bg-status-success px-4 py-2 text-xs font-medium text-white shadow-lg"
                  role="status"
                  aria-live="polite"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bundle added to cart!
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Testimonial Section ──────────────────────────────────────────────── */

function TestimonialSection() {
  return (
    <section className="py-16 sm:py-20 bg-brand-light" aria-labelledby="testimonials-heading">
      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            id="testimonials-heading"
            className="text-display-sm text-brand-dark text-center mb-10"
          >
            What Parents Say
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial) => (
              <motion.blockquote
                key={testimonial.name}
                variants={fadeInUp}
                className="card relative"
              >
                <span className="absolute -top-3 left-6 text-4xl text-brand-primary opacity-30">
                  &ldquo;
                </span>
                <p className="text-text-primary italic leading-relaxed">
                  {testimonial.quote}
                </p>
                <footer className="mt-4 pt-4 border-t border-surface-tertiary">
                  <cite className="not-italic">
                    <span className="font-semibold text-brand-dark">{testimonial.name}</span>
                    <span className="block text-xs text-text-muted mt-0.5">
                      {testimonial.event}
                    </span>
                  </cite>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA Section ──────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-brand-primary to-brand-secondary text-white">
      <div className="container-page text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-display-sm text-white">
            Planning a Party?
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-white/90 max-w-lg mx-auto">
            Need a custom quantity or have special requirements? We&apos;re happy to help
            create the perfect return gift experience.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#bundles"
              className="btn bg-white text-brand-primary hover:bg-brand-light px-8 py-3 font-semibold"
            >
              Browse Bundles
            </a>
            <a
              href="/contact"
              className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 font-semibold"
            >
              Contact Us
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
