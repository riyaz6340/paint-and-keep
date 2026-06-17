'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

/**
 * "How It Works" section with 4-step timeline and scroll-triggered animation.
 *
 * Steps: Choose Kit → Receive Package → Paint Creation → Keep Forever
 *
 * Requirements: 2.5
 */

const steps = [
  {
    number: 1,
    title: 'Choose Kit',
    description: 'Browse our collection and pick the perfect creative kit for any age or occasion.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
        <path d="M16 24L22 30L32 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'bg-brand-primary',
  },
  {
    number: 2,
    title: 'Receive Package',
    description: 'Your kit arrives at your door with everything included — paints, brushes, and figurines.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="10" y="14" width="28" height="22" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <path d="M10 22H38" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 14V36" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 10L24 14L30 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'bg-brand-secondary',
  },
  {
    number: 3,
    title: 'Paint Creation',
    description: 'Unleash your creativity! Follow along or freestyle — there are no rules, just fun.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M14 34L20 28C22 26 26 26 28 28L34 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 14C32 12 36 12 38 14C40 16 40 20 38 22L24 36L10 22C8 20 8 16 10 14C12 12 16 12 18 14L24 20L30 14Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    ),
    color: 'bg-brand-accent',
  },
  {
    number: 4,
    title: 'Keep Forever',
    description: 'Display your masterpiece at home — a beautiful memory you created yourself.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M24 6L28 18H40L30 26L34 38L24 30L14 38L18 26L8 18H20L24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    ),
    color: 'bg-brand-highlight',
  },
];

function TimelineStep({
  step,
  index,
  isLast,
}: {
  step: (typeof steps)[0];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-6 sm:gap-8"
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
    >
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${step.color} text-white
                      shadow-lg flex-shrink-0`}
        >
          {step.icon}
        </div>
        {!isLast && (
          <motion.div
            className="w-0.5 flex-1 mt-2 bg-gradient-to-b from-text-muted/40 to-transparent"
            initial={{ scaleY: 0, originY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-12 ${isLast ? 'pb-0' : ''}`}>
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Step {step.number}
        </span>
        <h3 className="font-heading text-xl font-semibold text-brand-dark mt-1">
          {step.title}
        </h3>
        <p className="text-text-secondary mt-2 max-w-sm leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-brand-light" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="how-it-works-heading"
            className="font-heading text-display-sm sm:text-display-md text-brand-dark"
          >
            How It Works
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            From choosing your kit to displaying your masterpiece — it&apos;s that simple.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <TimelineStep
              key={step.title}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
