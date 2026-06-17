'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * Individual Instagram post card displaying photo, caption (truncated at 200 chars),
 * username, date, and like count.
 *
 * Requirements: 9.2
 */

export interface InstagramPostData {
  id: string;
  imageUrl: string;
  caption: string;
  username: string;
  postDate: string;
  likeCount: number;
  postUrl?: string | null;
  isFeatured: boolean;
}

interface InstagramCardProps {
  post: InstagramPostData;
  featured?: boolean;
  index?: number;
}

function truncateCaption(caption: string, maxLength: number = 200): string {
  if (caption.length <= maxLength) return caption;
  return caption.substring(0, maxLength).trimEnd() + '…';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatLikeCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}

export default function InstagramCard({ post, featured = false, index = 0 }: InstagramCardProps) {
  const cardContent = (
    <motion.article
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-card hover:shadow-lg transition-shadow duration-300 ${
        featured ? 'ring-2 ring-paint-pink/30' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-paint-pink to-paint-purple text-white text-xs font-semibold shadow-md">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </span>
        </div>
      )}

      {/* Image container */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-[4/3]' : 'aspect-square'}`}>
        <Image
          src={post.imageUrl}
          alt={`Instagram post by @${post.username}: ${truncateCaption(post.caption, 60)}`}
          fill
          sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover overlay with like count */}
        <div className="absolute inset-0 bg-brand-dark/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-semibold">{formatLikeCount(post.likeCount)}</span>
          </div>
        </div>
      </div>

      {/* Post details */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-brand-dark">
            @{post.username}
          </span>
          <span className="text-xs text-text-secondary">
            {formatDate(post.postDate)}
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
          {truncateCaption(post.caption)}
        </p>
        <div className="flex items-center gap-1 mt-3 text-text-secondary">
          <svg className="w-4 h-4 text-paint-pink" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">{formatLikeCount(post.likeCount)} likes</span>
        </div>
      </div>
    </motion.article>
  );

  // Wrap with a link if postUrl is available
  if (post.postUrl) {
    return (
      <a
        href={post.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus:ring-2 focus:ring-paint-purple/50 rounded-2xl"
        aria-label={`View Instagram post by @${post.username}`}
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
