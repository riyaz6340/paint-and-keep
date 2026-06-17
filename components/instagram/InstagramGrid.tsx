'use client';

import { motion } from 'framer-motion';
import InstagramCard, { type InstagramPostData } from './InstagramCard';

/**
 * Instagram post grid with featured posts displayed in prominent position above non-featured.
 * Featured posts are displayed larger and more prominently at the top.
 * Non-featured posts are displayed in a standard grid below.
 *
 * Requirements: 9.1, 9.7
 */

interface InstagramGridProps {
  posts: InstagramPostData[];
}

export default function InstagramGrid({ posts }: InstagramGridProps) {
  // Separate featured and non-featured posts
  const featuredPosts = posts.filter((post) => post.isFeatured);
  const regularPosts = posts.filter((post) => !post.isFeatured);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-brand-dark mb-2">No posts yet</h3>
        <p className="text-text-secondary max-w-md mx-auto">
          Check back soon! We&apos;re always adding new content from our community.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Featured posts section */}
      {featuredPosts.length > 0 && (
        <motion.section
          aria-label="Featured Instagram posts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-paint-pink" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h3 className="text-lg font-semibold text-brand-dark">Featured Posts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredPosts.map((post, index) => (
              <InstagramCard key={post.id} post={post} featured index={index} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Regular posts section */}
      {regularPosts.length > 0 && (
        <motion.section
          aria-label="Instagram posts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {featuredPosts.length > 0 && (
            <h3 className="text-lg font-semibold text-brand-dark mb-6">Recent Posts</h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {regularPosts.map((post, index) => (
              <InstagramCard key={post.id} post={post} index={index} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
