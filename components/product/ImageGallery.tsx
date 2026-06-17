'use client';

/**
 * ImageGallery - Image gallery with thumbnail strip, zoom on hover (3x), and 360-view placeholder.
 * Requirements: 4.1
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  videoUrl?: string | null;
}

export default function ImageGallery({ images, productName, videoUrl }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [show360View, setShow360View] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[selectedIndex];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => setIsZooming(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (e.key === 'ArrowRight' && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-surface-tertiary flex items-center justify-center">
        <svg className="w-16 h-16 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Product image gallery">
      {/* Main image with zoom */}
      <div
        ref={imageContainerRef}
        className="relative aspect-square rounded-2xl overflow-hidden bg-surface-tertiary cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`${productName} - Image ${selectedIndex + 1} of ${images.length}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full"
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt || `${productName} image ${selectedIndex + 1}`}
              fill
              className="object-cover"
              style={
                isZooming
                  ? {
                      transform: 'scale(3)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transition: 'transform-origin 0.1s ease',
                    }
                  : { transform: 'scale(1)' }
              }
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={selectedIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom indicator */}
        {!isZooming && (
          <div className="absolute top-3 right-3 bg-surface/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary pointer-events-none">
            🔍 Hover to zoom
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-text-primary hover:bg-surface transition-colors disabled:opacity-30"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-text-primary hover:bg-surface transition-colors disabled:opacity-30"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip + 360 view + video buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {images.map((img, index) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              index === selectedIndex
                ? 'border-brand-primary ring-2 ring-brand-primary/20'
                : 'border-transparent hover:border-surface-tertiary'
            }`}
            aria-label={`View image ${index + 1}`}
            aria-current={index === selectedIndex ? 'true' : undefined}
          >
            <Image
              src={img.url}
              alt={img.alt || `Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </button>
        ))}

        {/* 360 View button */}
        <button
          type="button"
          onClick={() => setShow360View(!show360View)}
          className={`shrink-0 w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all ${
            show360View
              ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
              : 'border-surface-tertiary hover:border-brand-primary text-text-secondary hover:text-brand-primary'
          }`}
          aria-label="360-degree view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          360°
        </button>

        {/* Video indicator */}
        {videoUrl && (
          <button
            type="button"
            onClick={() => {
              const videoSection = document.getElementById('product-video');
              videoSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="shrink-0 w-16 h-16 rounded-lg border-2 border-surface-tertiary flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all"
            aria-label="Watch product video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Video
          </button>
        )}
      </div>

      {/* 360 View placeholder */}
      <AnimatePresence>
        {show360View && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-surface-secondary border border-surface-tertiary p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-brand-primary animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-sm font-medium text-text-secondary">
                360° View — Drag to rotate
              </p>
              <p className="text-xs text-text-muted mt-1">
                Interactive 360° view coming soon
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
