'use client';

/**
 * Paint & Keep - Community Stories Client Component
 *
 * Displays story cards in a responsive grid and the submission form.
 * Uses Framer Motion for animations and Tailwind CSS for styling.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { motion } from 'framer-motion';

import StoryCard from '@/components/community/StoryCard';
import StorySubmissionForm from '@/components/community/StorySubmissionForm';

interface CommunityStory {
  id: string;
  name: string;
  age: number;
  reviewText: string;
  photoUrl: string;
  artworkUrl: string;
  createdAt: string;
}

interface CommunityStoriesClientProps {
  stories: CommunityStory[];
}

/* ─── Animation Variants ─── */

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

export default function CommunityStoriesClient({
  stories,
}: CommunityStoriesClientProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-light via-white to-paint-purple/5 py-16 md:py-20">
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
              Community Stories
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-text-secondary leading-relaxed"
            >
              Discover inspiring stories from our creative community. See the amazing
              artwork created by kids and families, and share your own Paint &amp; Keep
              experience!
            </motion.p>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div
          className="absolute top-8 right-12 w-12 h-12 bg-paint-pink/15 rounded-blob animate-float"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-6 left-8 w-16 h-16 bg-paint-purple/10 rounded-blob animate-float-delay"
          aria-hidden="true"
        />
      </section>

      {/* Stories Grid Section */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="container-page">
          {stories.length > 0 ? (
            <>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
                className="text-center mb-12"
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl md:text-3xl font-heading font-bold text-brand-dark"
                >
                  Stories from Our Community
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  className="mt-3 text-text-secondary max-w-xl mx-auto"
                >
                  Real stories from real families who have experienced the joy of
                  painting together.
                </motion.p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              >
                {stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    id={story.id}
                    name={story.name}
                    age={story.age}
                    reviewText={story.reviewText}
                    photoUrl={story.photoUrl}
                    artworkUrl={story.artworkUrl}
                  />
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-5xl mb-4" aria-hidden="true">
                🎨
              </div>
              <h2 className="text-xl font-heading font-semibold text-brand-dark mb-2">
                No Stories Yet
              </h2>
              <p className="text-text-secondary max-w-md mx-auto">
                Be the first to share your Paint &amp; Keep experience! Submit your
                story below and inspire others to create.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Submission Form Section */}
      <section
        id="submit-story"
        className="py-16 md:py-20 bg-surface-secondary"
      >
        <div className="container-page">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-brand-dark">
                Share Your Story
              </h2>
              <p className="mt-3 text-text-secondary">
                Had a wonderful painting experience? We&apos;d love to hear about it!
                Submit your story and artwork below.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <StorySubmissionForm />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
