'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const ageGroups = [
  { label: 'Ages 4–6', value: 'AGES_4_6', desc: 'Simple & fun designs', color: 'bg-pink-50 border-pink-200', emoji: '🧒' },
  { label: 'Ages 7–9', value: 'AGES_7_9', desc: 'More detail & creativity', color: 'bg-blue-50 border-blue-200', emoji: '👧' },
  { label: 'Ages 10–12', value: 'AGES_10_12', desc: 'Challenging patterns', color: 'bg-green-50 border-green-200', emoji: '🧑' },
  { label: 'Teens & Adults', value: 'TEENS', desc: 'Complex & detailed art', color: 'bg-purple-50 border-purple-200', emoji: '🎨' },
  { label: 'Family', value: 'FAMILY', desc: 'Fun for all ages together', color: 'bg-amber-50 border-amber-200', emoji: '👨‍👩‍👧‍👦' },
];

export default function ShopByAge() {
  return (
    <section className="py-16 bg-surface-secondary" aria-labelledby="shop-by-age">
      <div className="container-page">
        <div className="text-center mb-10">
          <h2 id="shop-by-age" className="font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Shop by Age Group
          </h2>
          <p className="mt-3 text-text-secondary">
            Curated kits designed for every skill level
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {ageGroups.map((group, i) => (
            <motion.div
              key={group.value}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={`/shop?ageGroup=${group.value}`}
                className={`group flex flex-col items-center rounded-xl border-2 ${group.color} p-5 transition-all hover:shadow-md hover:-translate-y-1`}
              >
                <span className="text-4xl mb-2">{group.emoji}</span>
                <span className="text-sm font-bold text-text-primary">{group.label}</span>
                <span className="mt-1 text-xs text-text-secondary text-center">{group.desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
