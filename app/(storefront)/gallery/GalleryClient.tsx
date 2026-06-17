'use client';

/**
 * GalleryClient - Interactive customer artwork gallery with masonry grid,
 * filters, lightbox, infinite scroll, and like/share/save interactions.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/lib/hooks/useAuth';

/* ─── Types ────────────────────────────────────────────────────────────── */

interface GalleryPhoto {
  id: string;
  imageUrl: string;
  displayName: string;
  kitName: string;
  likeCount: number;
  isFeatured: boolean;
  createdAt: string;
  tags: { tag: string; source: string }[];
}

interface GalleryFilters {
  ageGroup: string;
  theme: string;
  occasion: string;
  date: string;
  location: string;
}

interface GalleryResponse {
  photos: GalleryPhoto[];
  hasMore: boolean;
  nextCursor: string | null;
}

/* ─── Filter Options ───────────────────────────────────────────────────── */

const AGE_GROUP_OPTIONS = [
  { value: '', label: 'All Ages' },
  { value: 'Ages 4-6', label: 'Ages 4-6' },
  { value: 'Ages 7-9', label: 'Ages 7-9' },
  { value: 'Ages 10-12', label: 'Ages 10-12' },
  { value: 'Teens', label: 'Teens' },
  { value: 'Adults', label: 'Adults' },
  { value: 'Family', label: 'Family' },
];

const THEME_OPTIONS = [
  { value: '', label: 'All Themes' },
  { value: 'Animals', label: 'Animals' },
  { value: 'Cartoon Characters', label: 'Cartoon Characters' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Festivals', label: 'Festivals' },
  { value: 'Birthday Special', label: 'Birthday Special' },
  { value: 'Nature', label: 'Nature' },
  { value: 'Abstract', label: 'Abstract' },
];

const OCCASION_OPTIONS = [
  { value: '', label: 'All Occasions' },
  { value: 'Birthday', label: 'Birthday' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'School Project', label: 'School Project' },
  { value: 'Family Fun', label: 'Family Fun' },
  { value: 'Party', label: 'Party' },
];

const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Bangalore', label: 'Bangalore' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Pune', label: 'Pune' },
];

/* ─── Animation Variants ───────────────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Generate Cloudinary optimized URL on client side.
 * Uses NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME for client-side URL construction.
 */
function getClientImageUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number | string } = {}
): string {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return publicId;

  const { width, height, quality = 'auto' } = options;
  const transforms: string[] = [`q_${quality}`, 'f_auto'];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_limit');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`;
}

/* ─── Main Gallery Component ───────────────────────────────────────────── */

export default function GalleryClient() {
  const { isAuthenticated } = useAuth();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filters, setFilters] = useState<GalleryFilters>({
    ageGroup: '',
    theme: '',
    occasion: '',
    date: '',
    location: '',
  });
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [savedPhotos, setSavedPhotos] = useState<Set<string>>(new Set());

  const scrollPositionRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /* ─── Fetch Photos ─────────────────────────────────────────────────── */

  const fetchPhotos = useCallback(
    async (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (filters.ageGroup) params.set('ageGroup', filters.ageGroup);
      if (filters.theme) params.set('theme', filters.theme);
      if (filters.occasion) params.set('occasion', filters.occasion);
      if (filters.date) params.set('date', filters.date);
      if (filters.location) params.set('location', filters.location);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/gallery?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch gallery');
      return (await res.json()) as GalleryResponse;
    },
    [filters]
  );

  /* ─── Initial Load + Filter Change ───────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchPhotos(null);
        if (!cancelled) {
          setPhotos(data.photos);
          setHasMore(data.hasMore);
          setNextCursor(data.nextCursor);
        }
      } catch {
        if (!cancelled) {
          setPhotos([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fetchPhotos]);

  /* ─── Infinite Scroll with IntersectionObserver ──────────────────────── */

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchPhotos(nextCursor);
      setPhotos((prev) => [...prev, ...data.photos]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch {
      // Silently fail — user can scroll again to retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, nextCursor, fetchPhotos]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  /* ─── Interactions ───────────────────────────────────────────────────── */

  const handleLike = useCallback(
    async (photoId: string) => {
      if (!isAuthenticated) {
        setShowSignInPrompt(true);
        return;
      }

      // Optimistic update
      setLikedPhotos((prev) => new Set(prev).add(photoId));
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, likeCount: p.likeCount + 1 } : p
        )
      );

      try {
        const res = await fetch(`/api/gallery/${photoId}/like`, { method: 'POST' });
        if (!res.ok) {
          // Revert optimistic update
          setLikedPhotos((prev) => {
            const next = new Set(prev);
            next.delete(photoId);
            return next;
          });
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoId ? { ...p, likeCount: p.likeCount - 1 } : p
            )
          );
        }
      } catch {
        // Revert on network error
        setLikedPhotos((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, likeCount: p.likeCount - 1 } : p
          )
        );
      }
    },
    [isAuthenticated]
  );

  const handleSave = useCallback(
    async (photoId: string) => {
      if (!isAuthenticated) {
        setShowSignInPrompt(true);
        return;
      }

      // Optimistic update
      setSavedPhotos((prev) => new Set(prev).add(photoId));

      try {
        const res = await fetch(`/api/gallery/${photoId}/save`, { method: 'POST' });
        if (!res.ok) {
          setSavedPhotos((prev) => {
            const next = new Set(prev);
            next.delete(photoId);
            return next;
          });
        }
      } catch {
        setSavedPhotos((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
      }
    },
    [isAuthenticated]
  );

  const handleShare = useCallback(async (photo: GalleryPhoto) => {
    const shareData = {
      title: `${photo.displayName}'s artwork - Paint & Keep`,
      text: `Check out this amazing artwork made with ${photo.kitName}!`,
      url: `${window.location.origin}/gallery?photo=${photo.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share or share failed — do nothing
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
      } catch {
        // Clipboard not available
      }
    }
  }, []);

  /* ─── Lightbox ───────────────────────────────────────────────────────── */

  const openLightbox = useCallback((photo: GalleryPhoto) => {
    scrollPositionRef.current = window.scrollY;
    setLightboxPhoto(photo);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxPhoto(null);
    document.body.style.overflow = '';
    // Restore scroll position
    window.scrollTo(0, scrollPositionRef.current);
  }, []);

  /* ─── Filter Handlers ────────────────────────────────────────────────── */

  const updateFilter = useCallback(
    (key: keyof GalleryFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({ ageGroup: '', theme: '', occasion: '', date: '', location: '' });
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen">
      {/* Hero / Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-highlight/20 via-brand-light to-paint-pink/20 py-12 sm:py-16">
        <div className="container-page relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-display-sm sm:text-display-md text-brand-dark"
          >
            Customer Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-text-secondary max-w-xl mx-auto"
          >
            Explore amazing artwork created by our community of artists — kids,
            families, and creative enthusiasts!
          </motion.p>
        </div>
      </section>

      {/* Filter Panel — Requirement 7.2 */}
      <FilterPanel
        filters={filters}
        onFilterChange={updateFilter}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Gallery Grid */}
      <section className="container-page py-8 sm:py-12" aria-label="Gallery photos">
        {isLoading ? (
          <LoadingSkeleton />
        ) : photos.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
        ) : (
          <>
            <MasonryGrid
              photos={photos}
              likedPhotos={likedPhotos}
              savedPhotos={savedPhotos}
              onLike={handleLike}
              onShare={handleShare}
              onSave={handleSave}
              onPhotoClick={openLightbox}
            />

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" aria-hidden="true" />

            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
          </>
        )}
      </section>

      {/* Lightbox Overlay — Requirement 7.4 */}
      <AnimatePresence>
        {lightboxPhoto && (
          <Lightbox photo={lightboxPhoto} onClose={closeLightbox} />
        )}
      </AnimatePresence>

      {/* Sign-In Prompt — Requirement 7.7 */}
      <AnimatePresence>
        {showSignInPrompt && (
          <SignInPrompt onClose={() => setShowSignInPrompt(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Filter Panel Component ───────────────────────────────────────────── */

function FilterPanel({
  filters,
  onFilterChange,
  onClear,
  hasActiveFilters,
}: {
  filters: GalleryFilters;
  onFilterChange: (key: keyof GalleryFilters, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <section
      className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-surface-tertiary"
      aria-label="Gallery filters"
    >
      <div className="container-page py-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Age Group"
            value={filters.ageGroup}
            options={AGE_GROUP_OPTIONS}
            onChange={(v) => onFilterChange('ageGroup', v)}
          />
          <FilterSelect
            label="Theme"
            value={filters.theme}
            options={THEME_OPTIONS}
            onChange={(v) => onFilterChange('theme', v)}
          />
          <FilterSelect
            label="Occasion"
            value={filters.occasion}
            options={OCCASION_OPTIONS}
            onChange={(v) => onFilterChange('occasion', v)}
          />
          <div className="flex items-center gap-1">
            <label htmlFor="gallery-date-filter" className="sr-only">
              Date
            </label>
            <input
              id="gallery-date-filter"
              type="date"
              value={filters.date}
              onChange={(e) => onFilterChange('date', e.target.value)}
              className="text-sm border border-surface-tertiary rounded-lg px-3 py-2 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              aria-label="Filter by date"
            />
          </div>
          <FilterSelect
            label="Location"
            value={filters.location}
            options={LOCATION_OPTIONS}
            onChange={(v) => onFilterChange('location', v)}
          />

          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-sm text-brand-primary hover:text-brand-dark font-medium transition-colors ml-2"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Filter Select Component ──────────────────────────────────────────── */

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <label htmlFor={`gallery-filter-${label}`} className="sr-only">
        {label}
      </label>
      <select
        id={`gallery-filter-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-sm border rounded-lg px-3 py-2 pr-8 appearance-none bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors ${
          value
            ? 'border-brand-primary text-brand-primary font-medium'
            : 'border-surface-tertiary text-text-secondary'
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

/* ─── Masonry Grid Component ───────────────────────────────────────────── */

function MasonryGrid({
  photos,
  likedPhotos,
  savedPhotos,
  onLike,
  onShare,
  onSave,
  onPhotoClick,
}: {
  photos: GalleryPhoto[];
  likedPhotos: Set<string>;
  savedPhotos: Set<string>;
  onLike: (id: string) => void;
  onShare: (photo: GalleryPhoto) => void;
  onSave: (id: string) => void;
  onPhotoClick: (photo: GalleryPhoto) => void;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
    >
      {photos.map((photo) => (
        <GalleryCard
          key={photo.id}
          photo={photo}
          isLiked={likedPhotos.has(photo.id)}
          isSaved={savedPhotos.has(photo.id)}
          onLike={() => onLike(photo.id)}
          onShare={() => onShare(photo)}
          onSave={() => onSave(photo.id)}
          onClick={() => onPhotoClick(photo)}
        />
      ))}
    </motion.div>
  );
}

/* ─── Gallery Card Component ───────────────────────────────────────────── */

function GalleryCard({
  photo,
  isLiked,
  isSaved,
  onLike,
  onShare,
  onSave,
  onClick,
}: {
  photo: GalleryPhoto;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  onClick: () => void;
}) {
  const thumbnailUrl = getClientImageUrl(photo.imageUrl, {
    width: 400,
    quality: 80,
  });

  return (
    <motion.article
      variants={fadeInUp}
      className="break-inside-avoid group relative overflow-hidden rounded-xl bg-surface shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      {/* Image */}
      <button
        type="button"
        onClick={onClick}
        className="block w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded-t-xl"
        aria-label={`View ${photo.displayName}'s artwork: ${photo.kitName}`}
      >
        <img
          src={thumbnailUrl}
          alt={`Artwork by ${photo.displayName} using ${photo.kitName}`}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {/* Featured badge */}
      {photo.isFeatured && (
        <div className="absolute top-2 left-2 bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
          ⭐ Featured
        </div>
      )}

      {/* Info + Actions */}
      <div className="p-3">
        <p className="text-sm font-semibold text-brand-dark truncate">
          {photo.displayName}
        </p>
        <p className="text-xs text-text-secondary truncate">{photo.kitName}</p>

        {/* Action buttons — Requirement 7.3 */}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={onLike}
            className={`flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${
              isLiked
                ? 'bg-red-50 text-red-500'
                : 'bg-surface-secondary text-text-secondary hover:text-red-500 hover:bg-red-50'
            }`}
            aria-label={isLiked ? 'Liked' : 'Like this photo'}
            aria-pressed={isLiked}
          >
            <HeartIcon filled={isLiked} />
            <span>{photo.likeCount}</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1 text-xs rounded-full px-2 py-1 bg-surface-secondary text-text-secondary hover:text-brand-primary hover:bg-brand-light transition-colors"
            aria-label="Share this photo"
          >
            <ShareIcon />
          </button>

          <button
            type="button"
            onClick={onSave}
            className={`flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${
              isSaved
                ? 'bg-brand-light text-brand-primary'
                : 'bg-surface-secondary text-text-secondary hover:text-brand-primary hover:bg-brand-light'
            }`}
            aria-label={isSaved ? 'Saved' : 'Save this photo'}
            aria-pressed={isSaved}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Lightbox Component — Requirement 7.4 ─────────────────────────────── */

function Lightbox({
  photo,
  onClose,
}: {
  photo: GalleryPhoto;
  onClose: () => void;
}) {
  const lightboxUrl = getClientImageUrl(photo.imageUrl, {
    width: 1200,
    quality: 85,
  });

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-4xl w-full max-h-[90vh] bg-surface rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Close lightbox"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Full-resolution image */}
        <div className="flex items-center justify-center bg-black max-h-[70vh] overflow-hidden">
          <img
            src={lightboxUrl}
            alt={`Full artwork by ${photo.displayName} using ${photo.kitName}`}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Photo details */}
        <div className="p-5">
          <h2 className="text-lg font-semibold text-brand-dark">
            {photo.displayName}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Kit: {photo.kitName}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Posted on{' '}
            {new Date(photo.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sign-In Prompt — Requirement 7.7 ─────────────────────────────────── */

function SignInPrompt({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-surface rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-light flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-brand-dark">
          Sign in to continue
        </h3>
        <p className="text-sm text-text-secondary mt-2">
          Please sign in to like and save photos to your collection.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/login"
            className="btn-primary px-6 py-2.5 text-sm font-medium w-full inline-block text-center"
          >
            Sign In
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Empty State — Requirement 7.6 ────────────────────────────────────── */

function EmptyState({
  hasActiveFilters,
  onClear,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-secondary flex items-center justify-center">
        <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-brand-dark">No photos found</h2>
      <p className="text-text-secondary mt-2 max-w-md mx-auto">
        {hasActiveFilters
          ? 'No artwork matches your current filters. Try adjusting or clearing your filters to see more results.'
          : 'The gallery is empty. Check back soon for amazing customer artwork!'}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="btn-primary mt-6 px-6 py-2.5 text-sm"
        >
          Clear All Filters
        </button>
      )}
    </motion.div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid rounded-xl bg-surface-secondary animate-pulse"
          style={{ height: `${200 + (i % 3) * 80}px` }}
        />
      ))}
    </div>
  );
}

/* ─── Loading Spinner ──────────────────────────────────────────────────── */

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-text-secondary" role="status" aria-label="Loading more photos">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm">Loading more artwork...</span>
    </div>
  );
}

/* ─── Icon Components ──────────────────────────────────────────────────── */

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}
