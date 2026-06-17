'use client';

import { motion } from 'framer-motion';

export interface PackageTierData {
  id: string;
  name: string;
  capacity: number;
  price: string;
  inclusions: string[];
  themes: string[];
  popular?: boolean;
}

interface PackageCardProps {
  tier: PackageTierData;
  isSelected: boolean;
  onSelect: (tier: PackageTierData) => void;
}

export default function PackageCard({ tier, isSelected, onSelect }: PackageCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative rounded-2xl border-2 p-6 md:p-8 shadow-card transition-colors cursor-pointer ${
        isSelected
          ? 'border-brand-primary bg-brand-primary/5 shadow-lg'
          : 'border-surface-tertiary bg-surface hover:border-brand-primary/40'
      } ${tier.popular ? 'ring-2 ring-brand-primary/20' : ''}`}
      onClick={() => onSelect(tier)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(tier);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Select ${tier.name} - ${tier.capacity} kids - ${tier.price}`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-brand-primary text-text-inverse text-xs font-bold px-4 py-1 rounded-full shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-heading font-bold text-brand-dark">{tier.name}</h3>
        <p className="text-sm text-text-secondary mt-1">{tier.capacity} Kids</p>
        <p className="text-3xl font-heading font-bold text-brand-primary mt-3">
          {tier.price}
        </p>
      </div>

      {/* Inclusions */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
          What&apos;s Included
        </h4>
        <ul className="space-y-2">
          {tier.inclusions.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
              <svg
                className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Themes */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
          Available Themes
        </h4>
        <div className="flex flex-wrap gap-2">
          {tier.themes.map((theme, index) => (
            <span
              key={index}
              className="text-xs bg-surface-secondary text-text-secondary px-2.5 py-1 rounded-full"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Select button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(tier);
        }}
        className={`mt-6 w-full rounded-xl py-3 px-6 font-heading font-semibold transition-all ${
          isSelected
            ? 'bg-brand-primary text-text-inverse shadow-button'
            : 'bg-surface-secondary text-brand-primary hover:bg-brand-primary/10'
        }`}
      >
        {isSelected ? '✓ Selected' : 'Select Package'}
      </button>
    </motion.div>
  );
}
