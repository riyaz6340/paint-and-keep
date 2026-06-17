'use client';

/**
 * ProductInfo - Product name, price, rating, description, what's included, age, difficulty.
 * Requirements: 4.3
 */

interface ProductInfoProps {
  name: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  description: string;
  ageGroup: string;
  difficultyLevel: string;
  category: { name: string };
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`Average rating: ${rating.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-brand-highlight' : 'text-surface-tertiary'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-text-secondary">
        {rating.toFixed(1)} ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; color: string }> = {
    EASY: { label: 'Easy', color: 'bg-status-success/10 text-status-success' },
    MEDIUM: { label: 'Medium', color: 'bg-status-warning/10 text-yellow-700' },
    HARD: { label: 'Hard', color: 'bg-status-error/10 text-status-error' },
  };
  const { label, color } = config[level] || { label: level, color: 'bg-surface-tertiary text-text-secondary' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

function AgeGroupBadge({ ageGroup }: { ageGroup: string }) {
  const ageLabels: Record<string, string> = {
    KIDS_4_7: '4-7 years',
    KIDS_8_12: '8-12 years',
    TEENS: '13+ years',
    ADULTS: 'Adults',
    ALL_AGES: 'All Ages',
    FAMILY: 'Family',
  };
  const label = ageLabels[ageGroup] || ageGroup;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      {label}
    </span>
  );
}

/**
 * Parse the product description to extract "What's Included" list.
 * Convention: lines starting with "- " after a "What's Included" heading.
 */
function parseDescription(description: string): { mainText: string; whatsIncluded: string[] } {
  const lines = description.split('\n');
  const whatsIncluded: string[] = [];
  const mainLines: string[] = [];
  let inWhatsIncluded = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes("what's included") || trimmed.toLowerCase().includes('whats included')) {
      inWhatsIncluded = true;
      continue;
    }
    if (inWhatsIncluded) {
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        whatsIncluded.push(trimmed.replace(/^[-•]\s*/, ''));
      } else if (trimmed === '') {
        // Blank line might end the list
        if (whatsIncluded.length > 0) {
          inWhatsIncluded = false;
        }
      } else {
        inWhatsIncluded = false;
        mainLines.push(line);
      }
    } else {
      mainLines.push(line);
    }
  }

  return {
    mainText: mainLines.join('\n').trim(),
    whatsIncluded,
  };
}

export default function ProductInfo({
  name,
  price,
  averageRating,
  reviewCount,
  description,
  ageGroup,
  difficultyLevel,
  category,
}: ProductInfoProps) {
  const { mainText, whatsIncluded } = parseDescription(description);

  return (
    <div className="space-y-5">
      {/* Category breadcrumb */}
      <p className="text-sm text-text-muted uppercase tracking-wide font-medium">
        {category.name}
      </p>

      {/* Product name */}
      <h1 className="text-display-sm sm:text-display-md text-brand-dark leading-tight">
        {name}
      </h1>

      {/* Rating */}
      <StarRating rating={averageRating} count={reviewCount} />

      {/* Price */}
      <p className="text-3xl font-bold text-brand-primary">
        ₹{price.toLocaleString('en-IN')}
      </p>

      {/* Badges: Age + Difficulty */}
      <div className="flex flex-wrap items-center gap-2">
        <AgeGroupBadge ageGroup={ageGroup} />
        <DifficultyBadge level={difficultyLevel} />
      </div>

      {/* Description */}
      <div className="pt-2 border-t border-surface-tertiary">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Description</h2>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {mainText}
        </p>
      </div>

      {/* What's Included */}
      {whatsIncluded.length > 0 && (
        <div className="pt-2 border-t border-surface-tertiary">
          <h2 className="text-lg font-semibold text-text-primary mb-2">What&apos;s Included</h2>
          <ul className="space-y-1.5">
            {whatsIncluded.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
