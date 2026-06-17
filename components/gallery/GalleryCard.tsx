'use client';

/**
 * GalleryCard - Individual photo card with like, share, and save buttons.
 *
 * Displays a gallery photo thumbnail with creator name, kit name, and
 * interaction buttons. Shows sign-in prompt for unauthenticated users
 * attempting like/save.
 *
 * Requirements: 7.1, 7.3, 7.7
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  displayName: string;
  kitName: string;
  likeCount: number;
  isFeatured: boolean;
  createdAt: string;
  tags: { tag: string; source: string }[];
}

interface GalleryCardProps {
  photo: GalleryPhoto;
  isAuthenticated: boolean;
  onPhotoClick: (photo: GalleryPhoto) => void;
  onSignInPrompt: () => void;
}

export default function GalleryCard({
  photo,
  isAuthenticated,
  onPhotoClick,
  onSignInPrompt,
}: GalleryCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(photo.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isAuthenticated) {
        onSignInPrompt();
        return;
      }

      if (isLiking || liked) return;

      setIsLiking(true);
      try {
        const res = await fetch(`/api/gallery/${photo.id}/like`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setLiked(true);
          setLikeCount(data.likeCount);
        }
      } catch {
        // Silently fail — user can retry
      } finally {
        setIsLiking(false);
      }
    },
    [isAuthenticated, isLiking, liked, onSignInPrompt, photo.id]
  );

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isAuthenticated) {
        onSignInPrompt();
        return;
      }

      if (isSaving || saved) return;

      setIsSaving(true);
      try {
        const res = await fetch(`/api/gallery/${photo.id}/save`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          setSaved(true);
        }
      } catch {
        // Silently fail
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, isSaving, saved, onSignInPrompt, photo.id]
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      const shareData = {
        title: `${photo.displayName}'s artwork — ${photo.kitName}`,
        text: `Check out this amazing artwork created with Paint & Keep!`,
        url: `${window.location.origin}/gallery?photo=${photo.id}`,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // User cancelled or share failed
        }
      } else {
        // Fallback: copy link to clipboard
        try {
          await navigator.clipboard.writeText(shareData.url);
        } catch {
          // Clipboard API not available
        }
      }
    },
    [photo.id, photo.displayName, photo.kitName]
  );

  // Build an optimized image URL via Cloudinary
  const thumbnailUrl = getOptimizedImageUrl(photo.imageUrl, 400);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative break-inside-avoid mb-4 cursor-pointer"
      onClick={() => onPhotoClick(photo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPhotoClick(photo);
        }
      }}
      aria-label={`View ${photo.displayName}'s artwork: ${photo.kitName}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-tertiary">
        <Image
          src={thumbnailUrl}
          alt={`Artwork by ${photo.displayName} using ${photo.kitName}`}
          width={400}
          height={500}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Featured badge */}
        {photo.isFeatured && (
          <div className="absolute top-3 left-3 bg-brand-highlight text-brand-dark text-xs font-bold px-2 py-1 rounded-full">
            ⭐ Featured
          </div>
        )}

        {/* Action buttons overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2">
            {/* Like button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              className={`touch-target flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                liked
                  ? 'bg-paint-red text-white'
                  : 'bg-white/90 text-text-primary hover:bg-white'
              }`}
              aria-label={liked ? 'Liked' : 'Like this photo'}
            >
              <HeartIcon filled={liked} />
              <span>{likeCount}</span>
            </button>

            {/* Share button */}
            <button
              type="button"
              onClick={handleShare}
              className="touch-target flex items-center rounded-full p-1.5 bg-white/90 text-text-primary hover:bg-white transition-colors"
              aria-label="Share this photo"
            >
              <ShareIcon />
            </button>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`touch-target flex items-center rounded-full p-1.5 transition-colors ${
                saved
                  ? 'bg-brand-primary text-white'
                  : 'bg-white/90 text-text-primary hover:bg-white'
              }`}
              aria-label={saved ? 'Saved' : 'Save this photo'}
            >
              <BookmarkIcon filled={saved} />
            </button>
          </div>
        </div>
      </div>

      {/* Photo info */}
      <div className="mt-2 px-1">
        <p className="text-sm font-semibold text-brand-dark truncate">
          {photo.displayName}
        </p>
        <p className="text-xs text-text-secondary truncate">{photo.kitName}</p>
      </div>
    </motion.div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function getOptimizedImageUrl(imageUrl: string, width: number): string {
  // If already a full URL (Cloudinary or external), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // For Cloudinary public IDs, construct URL with transformations
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_auto,f_auto/${imageUrl}`;
}

/* ─── Icons ────────────────────────────────────────────────────────────── */

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
      />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}
