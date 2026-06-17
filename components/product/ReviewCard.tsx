'use client';

/**
 * ReviewCard - Individual review display with star rating, text, user, and photos.
 * Requirements: 4.4
 */

import Image from 'next/image';

interface ReviewPhoto {
  id: string;
  url: string;
}

interface ReviewUser {
  id: string;
  name: string;
  profileImage: string | null;
}

export interface ReviewData {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  user: ReviewUser;
  photos: ReviewPhoto[];
}

interface ReviewCardProps {
  review: ReviewData;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-brand-highlight' : 'text-surface-tertiary'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="rounded-2xl border border-surface-tertiary bg-surface p-5">
      {/* Header: User info + rating */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-surface-tertiary">
          {review.user.profileImage ? (
            <Image
              src={review.user.profileImage}
              alt={review.user.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-sm font-bold text-brand-primary bg-brand-primary/10">
              {review.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {review.user.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} />
            <time className="text-xs text-text-muted" dateTime={review.createdAt}>
              {formattedDate}
            </time>
          </div>
        </div>
      </div>

      {/* Review text */}
      {review.text && (
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          {review.text}
        </p>
      )}

      {/* Review photos */}
      {review.photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative h-20 w-20 rounded-lg overflow-hidden bg-surface-tertiary"
            >
              <Image
                src={photo.url}
                alt="Review photo"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
