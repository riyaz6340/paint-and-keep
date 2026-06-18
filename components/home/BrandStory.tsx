'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BrandStory() {
  return (
    <section className="py-16 bg-gradient-to-b from-brand-light to-white" aria-labelledby="brand-story">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="brand-story" className="font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
              Our Story
            </h2>
            <p className="mt-6 text-base leading-relaxed text-text-secondary sm:text-lg">
              At Paint & Keep, we believe every child is an artist. Our ready-to-paint 
              creative kits are designed to spark imagination, build confidence, and create 
              lasting memories — one brushstroke at a time. We use non-toxic, child-safe 
              paints and eco-friendly packaging because creativity should never come at a cost 
              to little ones or the planet.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-primary">500+</div>
                <div className="mt-1 text-xs text-text-secondary">Happy Families</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-secondary">100%</div>
                <div className="mt-1 text-xs text-text-secondary">Non-Toxic & Safe</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-accent">50+</div>
                <div className="mt-1 text-xs text-text-secondary">Unique Designs</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-primary/90 hover:shadow-lg"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-xl border-2 border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark transition-all hover:bg-brand-dark hover:text-white"
              >
                Learn More About Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
