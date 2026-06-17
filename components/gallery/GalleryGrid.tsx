'use client';

/**
 * GalleryGrid - Masonry grid layout for gallery photos.
 *
 * Uses CSS columns to create a Pinterest-style masonry layout.
 * Responsive: 2 columns on mobile, 3 on tablet, 4 on desktop.
 *
 * Requirements: 7.1
 */

import GalleryCard, { type GalleryPhoto } from './GalleryCard';

interface GalleryGridProps {
  photos: GalleryPhoto[];
  isAuthenticated: boolean;
  onPhotoClick: (photo: GalleryPhoto) => void;
  onSignInPrompt: () => void;
}

export default function GalleryGrid({
  photos,
  isAuthenticated,
  onPhotoClick,
  onSignInPrompt,
}: GalleryGridProps) {
  return (
    <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
      {photos.map((photo) => (
        <GalleryCard
          key={photo.id}
          photo={photo}
          isAuthenticated={isAuthenticated}
          onPhotoClick={onPhotoClick}
          onSignInPrompt={onSignInPrompt}
        />
      ))}
    </div>
  );
}
