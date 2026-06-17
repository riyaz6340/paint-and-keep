'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Testimonials carousel with video and photo testimonials.
 * Auto-scrolling with minimum 3 testimonials displayed.
 *
 * Requirements: 2.8
 */

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  imageUrl: string;
  videoUrl?: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sneha Kapoor',
    role: 'Mother of 2',
    quote: 'My kids absolutely loved their Paint & Keep kits! They spent hours creating without asking for the iPad once. Best investment for screen-free fun.',
    imageUrl: '/images/testimonials/sneha.jpg',
    videoUrl: '/videos/testimonials/sneha-review.mp4',
    rating: 5,
  },
  {
    id: '2',
    name: 'Rajesh Sharma',
    role: 'Father & Artist',
    quote: 'The quality of the paints and figurines exceeded my expectations. We did a family painting night and it became our new weekly tradition!',
    imageUrl: '/images/testimonials/rajesh.jpg',
    rating: 5,
  },
  {
    id: '3',
    name: 'Priya Menon',
    role: 'Birthday Party Organizer',
    quote: 'Used Paint & Keep for my daughter\'s 7th birthday. All 15 kids were engaged for over an hour and got to take their artwork home. Parents were thrilled!',
    imageUrl: '/images/testimonials/priya.jpg',
    videoUrl: '/videos/testimonials/priya-party.mp4',
    rating: 5,
  },
  {
    id: '4',
    name: 'Amit Patel',
    role: 'Grandfather',
    quote: 'Bought these for my grandchildren. Watching them paint together was magical. The kits are safe, fun, and the finished pieces look professional!',
    imageUrl: '/images/testimonials/amit.jpg',
    rating: 5,
  },
  {
    id: '5',
    name: 'Kavita Reddy',
    role: 'School Teacher',
    quote: 'I use Paint & Keep kits in my art class. The children love them and the variety of themes keeps everyone engaged. Highly recommend for educators.',
    imageUrl: '/images/testimonials/kavita.jpg',
    videoUrl: '/videos/testimonials/kavita-class.mp4',
    rating: 5,
  },
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextTestimonial]);

  const current = testimonials[currentIndex];

  return (
    <section
      id="testimonials"
      className="py-16 sm:py-24 bg-brand-light"
      aria-labelledby="testimonials-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="testimonials-heading"
            className="font-heading text-display-sm sm:text-display-md text-brand-dark"
          >
            Happy Moments
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Hear from families who&apos;ve experienced the joy of Paint & Keep.
          </p>
        </motion.div>

        {/* Main testimonial display */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row items-center gap-8 bg-white rounded-3xl p-6 sm:p-8 shadow-card"
            >
              {/* Image / Video */}
              <div className="relative w-full md:w-2/5 flex-shrink-0">
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <Image
                    src={current.imageUrl}
                    alt={`${current.name} testimonial`}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                  {current.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-brand-primary ml-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <span className="sr-only">Play video testimonial</span>
                    </div>
                  )}
                </div>
                {current.videoUrl && (
                  <span className="absolute top-3 left-3 bg-brand-primary text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Video
                  </span>
                )}
              </div>

              {/* Quote content */}
              <div className="flex-1">
                {/* Star rating */}
                <div className="flex items-center gap-1 mb-4" aria-label={`Rating: ${current.rating} out of 5`}>
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-brand-highlight fill-current"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-text-primary text-base sm:text-lg leading-relaxed italic">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>

                <div className="mt-6">
                  <p className="font-semibold text-brand-dark">{current.name}</p>
                  <p className="text-sm text-text-muted">{current.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-white shadow-card hover:shadow-card-hover hover:bg-brand-primary hover:text-white
                         transition-all"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dots indicator */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-brand-primary w-6'
                      : 'bg-text-muted/30 hover:bg-text-muted/60'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === currentIndex ? 'true' : undefined}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-white shadow-card hover:shadow-card-hover hover:bg-brand-primary hover:text-white
                         transition-all"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
