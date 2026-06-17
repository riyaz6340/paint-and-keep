'use client';

/**
 * StoryCard - Displays a community story card with photo, name, age,
 * review text (truncated at 300 chars), and artwork image.
 *
 * Requirements: 8.1
 */

import { motion } from 'framer-motion';
import Image from 'next/image';

export interface StoryCardProps {
  id: string;
  name: string;
  age: number;
  reviewText: string;
  photoUrl: string;
  artworkUrl: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function StoryCard({
  name,
  age,
  reviewText,
  photoUrl,
  artworkUrl,
}: StoryCardProps) {
  const truncatedText =
    reviewText.length > 300 ? reviewText.slice(0, 300) + '…' : reviewText;

  return (
    <motion.article
      variants={fadeInUp}
      className="card overflow-hidden group hover:shadow-card-hover transition-shadow duration-300"
      aria-label={`Story by ${name}`}
    >
      {/* Artwork Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-tertiary">
        <Image
          src={artworkUrl}
          alt={`Artwork by ${name}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-tertiary shrink-0">
            <Image
              src={photoUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark text-sm leading-tight">
              {name}
            </h3>
            <p className="text-xs text-text-muted">Age {age}</p>
          </div>
        </div>

        {/* Review Text */}
        <p className="text-sm text-text-secondary leading-relaxed">
          {truncatedText}
        </p>
      </div>
    </motion.article>
  );
}
