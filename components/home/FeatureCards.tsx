'use client';

import { motion } from 'framer-motion';

/**
 * "Why Paint & Keep" section with 6 feature cards.
 * Each card has an icon, title, description, and scale-up hover animation.
 *
 * Requirements: 2.1, 2.2
 */

const features = [
  {
    title: 'Screen-Free Fun',
    description: 'Swap devices for brushes and enjoy hours of creative, hands-on play.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <rect x="8" y="10" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <line x1="24" y1="34" x2="24" y2="40" stroke="currentColor" strokeWidth="2.5" />
        <line x1="18" y1="40" x2="30" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="22" x2="34" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <circle cx="24" cy="22" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
      </svg>
    ),
    color: 'text-paint-blue',
    bg: 'bg-paint-blue/10',
  },
  {
    title: 'Boosts Creativity',
    description: 'Encourage imagination and artistic expression with every brush stroke.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <path d="M24 6L28 18H40L30 26L34 38L24 30L14 38L18 26L8 18H20L24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    color: 'text-brand-highlight',
    bg: 'bg-brand-highlight/10',
  },
  {
    title: 'Perfect Birthday Activity',
    description: 'Make birthday parties unforgettable with creative painting sessions.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <rect x="12" y="20" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M12 28H36" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <path d="M20 20V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 20V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="20" cy="11" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="28" cy="11" r="2" fill="currentColor" opacity="0.6" />
        <path d="M24 20V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="13" r="2" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    color: 'text-paint-pink',
    bg: 'bg-paint-pink/10',
  },
  {
    title: 'Take Home Your Artwork',
    description: 'Every creation is yours to keep — a lasting memory of creative fun.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <rect x="10" y="8" width="28" height="32" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <path d="M16 18L22 24L32 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <path d="M16 30H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M16 34H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    color: 'text-brand-accent',
    bg: 'bg-brand-accent/10',
  },
  {
    title: 'Family Bonding',
    description: 'Paint together and create shared memories that last a lifetime.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <circle cx="18" cy="16" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="30" cy="16" r="5" stroke="currentColor" strokeWidth="2.5" />
        <path d="M10 38C10 32 14 28 18 28C20 28 22 29 24 30C26 29 28 28 30 28C34 28 38 32 38 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-brand-secondary',
    bg: 'bg-brand-secondary/10',
  },
  {
    title: 'Safe & Kid Friendly',
    description: 'Non-toxic, child-safe paints and materials — peace of mind for parents.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        <path d="M24 6L38 14V24C38 32 32 39 24 42C16 39 10 32 10 24V14L24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M18 24L22 28L30 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-status-success',
    bg: 'bg-status-success/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function FeatureCards() {
  return (
    <section className="py-16 sm:py-24 bg-surface-secondary" aria-labelledby="why-paint-keep-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="why-paint-keep-heading"
            className="font-heading text-display-sm sm:text-display-md text-brand-dark"
          >
            Why Paint & Keep?
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Discover what makes our creative kits the perfect choice for kids and families.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white shadow-card
                         hover:shadow-card-hover transition-shadow cursor-default"
            >
              <div className={`p-4 rounded-xl ${feature.bg} ${feature.color} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-heading text-lg font-semibold text-brand-dark mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
