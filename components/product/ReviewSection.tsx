'use client';

/**
 * ReviewSection - Customer reviews with pagination (10 per page) and average rating.
 * Requirements: 4.4
 */

import { useState, useCallback } from 'react';
import ReviewCard, { type ReviewData } from './ReviewCard';

interface ReviewSectionProps {
  productId: string;
  initialReviews: ReviewData[];
  totalReviews: number;
  initialPage: number;
  totalPages: number;
  averageRating: number;
}

function AverageRatingDisplay({ rating, total }: { rating: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="text-3xl font-bold text-text-primary">{rating.toFixed(1)}</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-brand-highlight' : 'text-surface-tertiary'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-text-muted">{total} review{total !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewSection({
  productId,
  initialReviews,
  totalReviews,
  initialPage,
  totalPages,
  averageRating,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPage = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/${productId}/reviews?page=${page}&limit=10`
        );
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setReviews(data.reviews);
        setCurrentPage(page);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [productId]
  );

  if (totalReviews === 0) {
    return (
      <section aria-labelledby="reviews-heading" className="mt-12">
        <h2 id="reviews-heading" className="text-display-sm text-brand-dark mb-4">
          Customer Reviews
        </h2>
        <p className="text-text-secondary">No reviews yet. Be the first to review this product!</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 id="reviews-heading" className="text-display-sm text-brand-dark">
          Customer Reviews
        </h2>
        <AverageRatingDisplay rating={averageRating} total={totalReviews} />
      </div>

      {/* Reviews list */}
      <div className={`space-y-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Review pagination" className="flex items-center justify-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => fetchPage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <span className="text-sm text-text-secondary px-3">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => fetchPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}
