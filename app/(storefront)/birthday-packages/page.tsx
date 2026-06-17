'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PackageCard, { type PackageTierData } from '@/components/birthday/PackageCard';
import InquiryForm from '@/components/birthday/InquiryForm';

/* ─── Animation variants ─── */

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

/* ─── Package Tier Data ─── */

const PACKAGE_TIERS: PackageTierData[] = [
  {
    id: 'STARTER_10',
    name: 'Starter Pack',
    capacity: 10,
    price: '₹4,999',
    inclusions: [
      '10 painting kits (age-appropriate)',
      'All painting supplies included',
      'Disposable aprons for each child',
      'Table covers and setup materials',
      'Party instruction guide',
      'Carry bags for finished artwork',
    ],
    themes: ['Animals', 'Cartoon Characters', 'Rainbow & Colors'],
  },
  {
    id: 'POPULAR_20',
    name: 'Popular Pack',
    capacity: 20,
    price: '₹8,999',
    popular: true,
    inclusions: [
      '20 painting kits (age-appropriate)',
      'All painting supplies included',
      'Disposable aprons for each child',
      'Table covers and setup materials',
      'Dedicated party coordinator',
      'Party instruction guide',
      'Carry bags for finished artwork',
      'Birthday badge for the birthday child',
      'Photo booth props (painting themed)',
    ],
    themes: [
      'Animals',
      'Cartoon Characters',
      'Fantasy & Unicorns',
      'Superheroes',
      'Princess & Fairy',
      'Under the Sea',
    ],
  },
  {
    id: 'MEGA_50',
    name: 'Mega Pack',
    capacity: 50,
    price: '₹19,999',
    inclusions: [
      '50 painting kits (age-appropriate)',
      'All painting supplies included',
      'Disposable aprons for each child',
      'Table covers and full setup service',
      'Dedicated party coordinator + assistant',
      'Party instruction guide',
      'Premium carry bags for finished artwork',
      'Birthday badge + crown for the birthday child',
      'Photo booth props (painting themed)',
      'Custom birthday banner',
      'Thank-you cards for guests',
      'Post-party cleanup assistance',
    ],
    themes: [
      'Animals',
      'Cartoon Characters',
      'Fantasy & Unicorns',
      'Superheroes',
      'Princess & Fairy',
      'Under the Sea',
      'Dinosaurs',
      'Space & Planets',
      'Rainbow & Colors',
      'Nature & Flowers',
    ],
  },
];

/* ─── Page Component ─── */

export default function BirthdayPackagesPage() {
  const [selectedTier, setSelectedTier] = useState<PackageTierData | null>(null);

  const handleTierSelect = (tier: PackageTierData) => {
    setSelectedTier(tier);
    // Scroll to the inquiry form
    setTimeout(() => {
      document.getElementById('inquiry-form-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-light via-white to-paint-teal/5 py-16 md:py-20">
        <div className="container-page">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-display-md md:text-display-lg text-brand-dark font-heading"
            >
              Birthday Party Packages
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-text-secondary leading-relaxed"
            >
              Make your child&apos;s birthday extra special with our creative painting party
              packages. Every kid goes home with their own masterpiece!
            </motion.p>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div
          className="absolute top-6 right-10 w-14 h-14 bg-paint-orange/15 rounded-blob animate-float"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-6 left-8 w-18 h-18 bg-paint-purple/10 rounded-blob animate-float-delay"
          aria-hidden="true"
        />
      </section>

      {/* Package Tiers Section */}
      <section className="py-16 md:py-20 bg-surface">
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
              className="text-2xl md:text-3xl font-heading font-bold text-brand-dark"
            >
              Choose Your Package
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-3 text-text-secondary max-w-xl mx-auto"
            >
              Select the perfect package for your party size. All packages include everything
              needed for a fun and creative painting session.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
          >
            {PACKAGE_TIERS.map((tier) => (
              <motion.div key={tier.id} variants={fadeInUp}>
                <PackageCard
                  tier={tier}
                  isSelected={selectedTier?.id === tier.id}
                  onSelect={handleTierSelect}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section id="inquiry-form-section" className="py-16 md:py-20 bg-surface-secondary">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-brand-dark">
                Send Us an Inquiry
              </h2>
              <p className="mt-3 text-text-secondary">
                Fill in the details below and our team will get back to you within 24 hours
                to help plan the perfect party.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-surface rounded-2xl p-6 md:p-8 shadow-card"
            >
              <InquiryForm selectedTier={selectedTier} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Info Section */}
      <section className="py-12 md:py-16 bg-surface">
        <div className="container-page">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="space-y-2">
              <div className="text-3xl" aria-hidden="true">🎨</div>
              <h3 className="font-heading font-semibold text-text-primary">
                Everything Included
              </h3>
              <p className="text-sm text-text-secondary">
                Kits, supplies, aprons, and setup — all taken care of so you can enjoy the party.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl" aria-hidden="true">🏠</div>
              <h3 className="font-heading font-semibold text-text-primary">
                At Your Venue
              </h3>
              <p className="text-sm text-text-secondary">
                We deliver everything to your preferred location — home, park, or venue.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl" aria-hidden="true">🎁</div>
              <h3 className="font-heading font-semibold text-text-primary">
                Take Home Art
              </h3>
              <p className="text-sm text-text-secondary">
                Every child takes home their unique masterpiece — the best party favour ever!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
