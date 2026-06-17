'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

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

/* ─── Data ─── */

const values = [
  {
    icon: '🎨',
    title: 'Creativity First',
    description:
      'We believe every child is born an artist. Our kits unlock that potential through guided, hands-on painting experiences.',
  },
  {
    icon: '👪',
    title: 'Family Bonding',
    description:
      'Painting together creates memories that last a lifetime. Our kits are designed for families to enjoy quality time away from screens.',
  },
  {
    icon: '🌱',
    title: 'Safe & Sustainable',
    description:
      'All our paints are non-toxic and certified safe. We use eco-friendly packaging and responsibly sourced materials.',
  },
  {
    icon: '⭐',
    title: 'Premium Quality',
    description:
      'Every kit is curated with high-quality canvases, brushes, and paints that deliver professional-looking results for all ages.',
  },
  {
    icon: '🎉',
    title: 'Joy & Fun',
    description:
      'Art should be joyful, not stressful. We design experiences that are accessible, fun, and rewarding for beginners and pros alike.',
  },
  {
    icon: '🤝',
    title: 'Community',
    description:
      'We are building a community of young artists who inspire each other and celebrate creativity together.',
  },
];

const timeline = [
  {
    year: '2021',
    title: 'The Idea',
    description:
      "Born from a parent's frustration with excessive screen time, the idea of ready-to-paint kits for kids took shape.",
  },
  {
    year: '2022',
    title: 'First Kits',
    description:
      'Launched our first collection of 10 painting kits at local school fairs and birthday parties.',
  },
  {
    year: '2023',
    title: 'Growing Community',
    description:
      'Reached 5,000+ happy families, introduced birthday party packages, and launched our online store.',
  },
  {
    year: '2024',
    title: 'National Reach',
    description:
      'Expanded to deliver across India with 50+ kit designs, return gift bundles, and school partnership programs.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-brand-light via-white to-brand-highlight/10 py-16 md:py-24">
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
              About Paint & Keep
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-text-secondary leading-relaxed"
            >
              We are on a mission to bring creativity, joy, and quality family
              time to every home — one painting kit at a time.
            </motion.p>
          </motion.div>
        </div>
        {/* Decorative paint blobs */}
        <div
          className="absolute top-8 left-8 w-16 h-16 bg-paint-pink/20 rounded-blob animate-float"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-8 right-12 w-20 h-20 bg-paint-blue/15 rounded-blob animate-float-delay"
          aria-hidden="true"
        />
      </section>

      {/* Brand Story */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeInUp}>
              <h2 className="text-display-sm text-brand-dark font-heading mb-4">
                Our Story
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  Paint & Keep started in a small living room in 2021, when a
                  parent noticed their children spending too many hours on
                  screens and too few moments creating with their hands.
                </p>
                <p>
                  What began as DIY painting sessions for neighbourhood kids
                  quickly grew into a passion project. The joy on children's
                  faces when they completed their first painting — that sense of
                  pride and accomplishment — was irresistible.
                </p>
                <p>
                  Today, Paint & Keep delivers curated painting kits to thousands
                  of families across India, powering birthday celebrations,
                  school activities, return gifts, and everyday creative moments
                  that bring families closer together.
                </p>
              </div>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-card"
            >
              <Image
                src="/images/about/brand-story.jpg"
                alt="Children joyfully painting together at a Paint & Keep workshop"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-20 bg-surface-secondary">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Mission */}
            <motion.div
              variants={fadeInUp}
              className="bg-surface rounded-2xl shadow-card p-8"
            >
              <div className="text-3xl mb-3" aria-hidden="true">🎯</div>
              <h2 className="text-xl font-heading font-semibold text-brand-dark mb-3">
                Our Mission
              </h2>
              <p className="text-text-secondary leading-relaxed">
                To make creative expression accessible, fun, and rewarding for
                every child and family. We design painting experiences that
                build confidence, reduce screen time, and create lasting memories
                through art.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              variants={fadeInUp}
              className="bg-surface rounded-2xl shadow-card p-8"
            >
              <div className="text-3xl mb-3" aria-hidden="true">🌟</div>
              <h2 className="text-xl font-heading font-semibold text-brand-dark mb-3">
                Our Vision
              </h2>
              <p className="text-text-secondary leading-relaxed">
                To become India's most loved creative brand for kids and
                families — inspiring millions to discover the joy of painting
                and building a vibrant community of young artists.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-display-sm text-brand-dark font-heading text-center mb-10"
            >
              Our Values
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value) => (
                <motion.div
                  key={value.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03 }}
                  className="bg-surface-secondary rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <div className="text-3xl mb-3" aria-hidden="true">
                    {value.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 md:py-20 bg-surface-secondary">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              variants={fadeInUp}
              className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-card order-2 md:order-1"
            >
              <Image
                src="/images/about/founder.jpg"
                alt="Paint & Keep founder with children at a painting workshop"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="order-1 md:order-2">
              <h2 className="text-display-sm text-brand-dark font-heading mb-4">
                Meet the Founder
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  &quot;As a parent, I watched my kids light up when they
                  completed their first painting. That spark of creativity and
                  pride — I wanted every child to experience it.&quot;
                </p>
                <p>
                  What started as a small batch of DIY kits for friends and
                  family quickly grew into a movement. Parents were hungry for
                  meaningful, screen-free activities that brought families
                  together.
                </p>
                <p>
                  Today, Paint & Keep kits have reached thousands of homes,
                  schools, and birthday parties across India. Every kit we send
                  out carries the same goal: to spark joy, build confidence,
                  and create moments worth keeping.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-display-sm text-brand-dark font-heading text-center mb-12"
            >
              Our Journey
            </motion.h2>
            <div className="max-w-2xl mx-auto relative">
              {/* Timeline line */}
              <div
                className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-brand-primary/20 -translate-x-1/2"
                aria-hidden="true"
              />
              <div className="space-y-10">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    variants={fadeInUp}
                    className={`relative flex items-start gap-6 ${
                      index % 2 === 0
                        ? 'md:flex-row'
                        : 'md:flex-row-reverse md:text-right'
                    }`}
                  >
                    {/* Dot */}
                    <div
                      className="absolute left-6 md:left-1/2 w-4 h-4 bg-brand-primary rounded-full -translate-x-1/2 border-4 border-surface z-10"
                      aria-hidden="true"
                    />
                    {/* Content */}
                    <div className="ml-12 md:ml-0 md:w-1/2 bg-surface-secondary rounded-2xl p-5 shadow-card">
                      <span className="inline-block bg-brand-primary/10 text-brand-primary font-heading font-bold text-sm px-3 py-1 rounded-full mb-2">
                        {item.year}
                      </span>
                      <h3 className="font-heading font-semibold text-text-primary mb-1">
                        {item.title}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Photos gallery */}
      <section className="py-16 md:py-20 bg-surface-secondary">
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-display-sm text-brand-dark font-heading text-center mb-10"
            >
              Moments Worth Keeping
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {[
                { src: '/images/about/gallery-1.jpg', alt: 'Child painting a colorful canvas' },
                { src: '/images/about/gallery-2.jpg', alt: 'Family painting together at home' },
                { src: '/images/about/gallery-3.jpg', alt: 'Kids at a birthday painting party' },
                { src: '/images/about/gallery-4.jpg', alt: 'Finished artwork displayed on wall' },
                { src: '/images/about/gallery-5.jpg', alt: 'Children showing their painted creations' },
                { src: '/images/about/gallery-6.jpg', alt: 'Paint & Keep kit unboxing experience' },
                { src: '/images/about/gallery-7.jpg', alt: 'School workshop with Paint & Keep kits' },
                { src: '/images/about/gallery-8.jpg', alt: 'Proud child holding finished painting' },
              ].map((photo, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.03 }}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
