'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * Instagram preview section displaying 4-8 most recently approved posts.
 *
 * Requirements: 2.7
 */

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  username: string;
  postDate: string;
  likeCount: number;
  postUrl?: string;
}

// Placeholder data for when API isn't available yet
const placeholderPosts: InstagramPost[] = [
  { id: '1', imageUrl: '/images/instagram/post-1.jpg', caption: 'My daughter loved painting this unicorn! 🦄 #PaintAndKeep', username: 'happy_mom_crafts', postDate: '2024-03-15', likeCount: 142 },
  { id: '2', imageUrl: '/images/instagram/post-2.jpg', caption: 'Birthday party painting session was a hit! 🎨', username: 'partymom_india', postDate: '2024-03-14', likeCount: 98 },
  { id: '3', imageUrl: '/images/instagram/post-3.jpg', caption: 'Family paint night 🎨❤️ #PaintAndKeep', username: 'creative_family_fun', postDate: '2024-03-13', likeCount: 215 },
  { id: '4', imageUrl: '/images/instagram/post-4.jpg', caption: 'Look what my 5-year-old made! So proud 🌟', username: 'proud_parent_art', postDate: '2024-03-12', likeCount: 176 },
  { id: '5', imageUrl: '/images/instagram/post-5.jpg', caption: 'Return gifts sorted! Everyone loved them 🎁', username: 'event_planner_mom', postDate: '2024-03-11', likeCount: 89 },
  { id: '6', imageUrl: '/images/instagram/post-6.jpg', caption: 'Screen-free Saturday with Paint & Keep! 📵🎨', username: 'mindful_parenting', postDate: '2024-03-10', likeCount: 203 },
];

export default function InstagramPreview() {
  const [posts, setPosts] = useState<InstagramPost[]>(placeholderPosts);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/instagram?limit=8&status=approved');
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length >= 4) {
            setPosts(data.posts.slice(0, 8));
          }
        }
      } catch {
        // Keep placeholder data on error
      }
    }
    fetchPosts();
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-surface-secondary" aria-labelledby="instagram-preview-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="instagram-preview-heading"
            className="font-heading text-display-sm sm:text-display-md text-brand-dark"
          >
            <span className="bg-gradient-to-r from-paint-pink via-paint-purple to-paint-orange bg-clip-text text-transparent">
              @paintandkeep
            </span>
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Follow us on Instagram for daily inspiration and featured creations.
          </p>
        </motion.div>

        {/* Posts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {posts.slice(0, 8).map((post, index) => (
            <motion.div
              key={post.id}
              className="group relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="relative aspect-square overflow-hidden rounded-xl shadow-card">
                <Image
                  src={post.imageUrl}
                  alt={`Instagram post by ${post.username}: ${post.caption.substring(0, 50)}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100
                                transition-opacity duration-300 flex flex-col items-center justify-center p-3">
                  <div className="flex items-center gap-3 text-white">
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{post.likeCount}</span>
                    </span>
                  </div>
                  <p className="text-white text-xs mt-2 text-center line-clamp-2 opacity-80">
                    {post.caption}
                  </p>
                  <p className="text-white/70 text-xs mt-1">@{post.username}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Follow link */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/instagram"
            className="inline-flex items-center gap-2 text-brand-secondary font-semibold hover:text-brand-secondary/80 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Follow on Instagram
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
