'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * Customer gallery preview in a multi-column masonry layout (6-12 approved photos).
 *
 * Requirements: 2.6
 */

interface GalleryPhoto {
  id: string;
  imageUrl: string;
  displayName: string;
  kitName: string;
}

// Placeholder data for when API isn't available yet
const placeholderPhotos: GalleryPhoto[] = [
  { id: '1', imageUrl: '/images/gallery/artwork-1.jpg', displayName: 'Aarav', kitName: 'Unicorn Magic' },
  { id: '2', imageUrl: '/images/gallery/artwork-2.jpg', displayName: 'Priya', kitName: 'Dino World' },
  { id: '3', imageUrl: '/images/gallery/artwork-3.jpg', displayName: 'Ishaan', kitName: 'Space Adventure' },
  { id: '4', imageUrl: '/images/gallery/artwork-4.jpg', displayName: 'Meera', kitName: 'Flower Garden' },
  { id: '5', imageUrl: '/images/gallery/artwork-5.jpg', displayName: 'Kabir', kitName: 'Ocean Friends' },
  { id: '6', imageUrl: '/images/gallery/artwork-6.jpg', displayName: 'Ananya', kitName: 'Fairy Tale Castle' },
  { id: '7', imageUrl: '/images/gallery/artwork-7.jpg', displayName: 'Vihaan', kitName: 'Jungle Safari' },
  { id: '8', imageUrl: '/images/gallery/artwork-8.jpg', displayName: 'Diya', kitName: 'Princess Crown' },
];

export default function GalleryPreview() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(placeholderPhotos);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch('/api/gallery?limit=12&status=approved');
        if (res.ok) {
          const data = await res.json();
          if (data.photos && data.photos.length >= 6) {
            setPhotos(data.photos.slice(0, 12));
          }
        }
      } catch {
        // Keep placeholder data on error
      }
    }
    fetchGallery();
  }, []);

  return (
    <section className="py-16 sm:py-24" aria-labelledby="gallery-preview-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="gallery-preview-heading"
            className="font-heading text-display-sm sm:text-display-md text-brand-dark"
          >
            Customer Gallery
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            See the beautiful artwork our community has created with Paint & Keep kits.
          </p>
        </motion.div>

        {/* Masonry grid layout */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              className="mb-3 sm:mb-4 break-inside-avoid"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="group relative overflow-hidden rounded-xl shadow-card hover:shadow-card-hover transition-shadow">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: index % 3 === 0 ? '3/4' : index % 3 === 1 ? '1/1' : '4/5' }}
                >
                  <Image
                    src={photo.imageUrl}
                    alt={`Artwork by ${photo.displayName} using ${photo.kitName} kit`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                  flex items-end p-3">
                    <div className="text-white">
                      <p className="text-sm font-semibold">{photo.displayName}</p>
                      <p className="text-xs opacity-80">{photo.kitName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-primary/80 transition-colors"
          >
            View Full Gallery
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
