'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

import type { InstagramPostItem } from './page';

/* ─── Animation variants ─── */

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

/* ─── Helpers ─── */

function truncateCaption(caption: string, maxLength: number = 200): string {
  if (caption.length <= maxLength) return caption;
  return caption.slice(0, maxLength).trimEnd() + '…';
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatLikeCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

/* ─── Components ─── */

interface InstagramWallClientProps {
  featuredPosts: InstagramPostItem[];
  regularPosts: InstagramPostItem[];
}

function InstagramCard({
  post,
  isFeaturedCard = false,
}: {
  post: InstagramPostItem;
  isFeaturedCard?: boolean;
}) {
  const cardContent = (
    <motion.article
      variants={isFeaturedCard ? scaleIn : fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative bg-surface rounded-2xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden ${
        isFeaturedCard ? 'ring-2 ring-brand-highlight' : ''
      }`}
    >
      {/* Featured badge */}
      {isFeaturedCard && (
        <div className="absolute top-3 left-3 z-10 bg-brand-highlight text-brand-dark text-xs font-heading font-semibold px-3 py-1 rounded-full shadow-sm">
          ⭐ Featured
        </div>
      )}

      {/* Image */}
      <div
        className={`relative w-full overflow-hidden ${
          isFeaturedCard ? 'aspect-[4/3]' : 'aspect-square'
        }`}
      >
        <Image
          src={post.imageUrl}
          alt={`Instagram post by @${post.username}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes={
            isFeaturedCard
              ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
          }
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Username and date */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading font-semibold text-brand-primary truncate">
            @{post.username}
          </span>
          <time
            dateTime={post.postDate}
            className="text-xs text-text-muted whitespace-nowrap ml-2"
          >
            {formatDate(post.postDate)}
          </time>
        </div>

        {/* Caption */}
        <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">
          {truncateCaption(post.caption)}
        </p>

        {/* Like count and Instagram link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-text-muted">
            <HeartIcon />
            <span className="text-sm font-medium">
              {formatLikeCount(post.likeCount)}
            </span>
          </div>
          {post.postUrl && (
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-primary hover:text-brand-secondary transition-colors font-medium"
              aria-label={`View original post by @${post.username} on Instagram`}
            >
              View on Instagram →
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );

  return cardContent;
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 text-paint-red"
      aria-hidden="true"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-8 h-8"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function InstagramWallClient({
  featuredPosts,
  regularPosts,
}: InstagramWallClientProps) {
  const hasPosts = featuredPosts.length > 0 || regularPosts.length > 0;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-brand-light via-white to-paint-pink/10 py-16 md:py-20 overflow-hidden">
        <div className="container-page">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 text-brand-primary mb-4"
            >
              <InstagramIcon />
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-display-md md:text-display-lg text-brand-dark font-heading"
            >
              Instagram Wall
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-text-secondary leading-relaxed"
            >
              See what our creative community is sharing! Browse curated posts
              from #PaintAndKeep and @paintandkeep.
            </motion.p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute top-6 left-6 w-14 h-14 bg-paint-pink/20 rounded-blob animate-float"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-8 right-10 w-18 h-18 bg-paint-purple/15 rounded-blob animate-float-delay"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 right-1/4 w-10 h-10 bg-brand-highlight/20 rounded-full animate-paint-drop"
          aria-hidden="true"
        />
      </section>

      {/* Content */}
      {!hasPosts ? (
        /* Empty state */
        <section className="py-20 bg-surface">
          <div className="container-page text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="text-5xl mb-4"
                role="img"
                aria-label="Camera emoji"
              >
                📸
              </div>
              <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">
                No posts yet
              </h2>
              <p className="text-text-secondary max-w-md mx-auto">
                We&apos;re curating amazing content from our community. Follow
                us on Instagram and tag your creations with{' '}
                <span className="font-semibold text-brand-primary">
                  #PaintAndKeep
                </span>{' '}
                to be featured here!
              </p>
              <a
                href="https://instagram.com/paintandkeep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 bg-brand-primary text-white px-6 py-3 rounded-xl font-heading font-semibold shadow-button hover:shadow-button-hover hover:bg-brand-primary/90 transition-all"
              >
                <InstagramIcon />
                Follow @paintandkeep
              </a>
            </motion.div>
          </div>
        </section>
      ) : (
        <>
          {/* Featured Posts Section */}
          {featuredPosts.length > 0 && (
            <section className="py-12 md:py-16 bg-surface-secondary">
              <div className="container-page">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={staggerContainer}
                >
                  <motion.div variants={fadeInUp} className="mb-8">
                    <h2 className="text-display-sm text-brand-dark font-heading">
                      ⭐ Featured Posts
                    </h2>
                    <p className="text-text-secondary mt-1">
                      Handpicked highlights from our community
                    </p>
                  </motion.div>
                  <div
                    className={`grid gap-6 ${
                      featuredPosts.length === 1
                        ? 'grid-cols-1 max-w-lg'
                        : featuredPosts.length === 2
                          ? 'grid-cols-1 md:grid-cols-2'
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {featuredPosts.map((post) => (
                      <InstagramCard
                        key={post.id}
                        post={post}
                        isFeaturedCard
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {/* Regular Posts Grid */}
          {regularPosts.length > 0 && (
            <section className="py-12 md:py-16 bg-surface">
              <div className="container-page">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={staggerContainer}
                >
                  {featuredPosts.length > 0 && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <h2 className="text-display-sm text-brand-dark font-heading">
                        Latest Posts
                      </h2>
                      <p className="text-text-secondary mt-1">
                        Fresh creations from the #PaintAndKeep community
                      </p>
                    </motion.div>
                  )}
                  {featuredPosts.length === 0 && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <h2 className="text-display-sm text-brand-dark font-heading">
                        Community Posts
                      </h2>
                      <p className="text-text-secondary mt-1">
                        See what our creative community is sharing
                      </p>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {regularPosts.map((post) => (
                      <InstagramCard key={post.id} post={post} />
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-brand-primary/5 via-paint-pink/5 to-brand-highlight/5">
        <div className="container-page text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-brand-dark mb-3">
              Want to be featured?
            </h2>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              Share your Paint & Keep creations on Instagram with{' '}
              <span className="font-semibold text-brand-primary">
                #PaintAndKeep
              </span>{' '}
              and tag{' '}
              <span className="font-semibold text-brand-primary">
                @paintandkeep
              </span>{' '}
              for a chance to be featured on our wall!
            </p>
            <a
              href="https://instagram.com/paintandkeep"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-heading font-semibold shadow-button hover:shadow-button-hover hover:bg-brand-primary/90 transition-all"
            >
              <InstagramIcon />
              Follow us on Instagram
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
