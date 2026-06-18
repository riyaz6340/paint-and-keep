'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const categories = [
  { name: 'Animals', slug: 'animals', emoji: '🦋', color: 'from-pink-400 to-rose-500' },
  { name: 'Fantasy', slug: 'fantasy', emoji: '🦄', color: 'from-purple-400 to-indigo-500' },
  { name: 'Nature', slug: 'nature', emoji: '🌿', color: 'from-green-400 to-emerald-500' },
  { name: 'Festivals', slug: 'festivals', emoji: '🪔', color: 'from-amber-400 to-orange-500' },
  { name: 'Birthday Special', slug: 'birthday-special', emoji: '🎂', color: 'from-pink-400 to-fuchsia-500' },
  { name: 'Space', slug: 'space', emoji: '🚀', color: 'from-blue-400 to-cyan-500' },
  { name: 'Vehicles', slug: 'vehicles', emoji: '🚗', color: 'from-sky-400 to-blue-500' },
  { name: 'Mandala', slug: 'mandala', emoji: '🔮', color: 'from-violet-400 to-purple-500' },
];

export default function ShopByCategory() {
  return (
    <section className="py-16 bg-white" aria-labelledby="shop-by-category">
      <div className="container-page">
        <div className="text-center mb-10">
          <h2 id="shop-by-category" className="font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-3 text-text-secondary">
            Find the perfect painting kit for every interest
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/shop?category=${cat.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${cat.color} text-3xl shadow-md`}>
                  {cat.emoji}
                </div>
                <span className="mt-3 text-sm font-semibold text-text-primary group-hover:text-brand-primary">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
