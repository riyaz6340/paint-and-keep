/**
 * Paint & Keep - Application Constants
 */

export const SITE_CONFIG = {
  name: 'Paint & Keep',
  tagline: 'Less Screen Time. More Creative Time.',
  description:
    'Discover ready-to-paint creative kits for kids, birthday parties, and families.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://paintandkeep.com',
} as const;

/** Responsive breakpoints matching Tailwind config and Requirement 24.1 */
export const BREAKPOINTS = {
  mobile: { min: 320, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 2560 },
} as const;

/** Minimum touch target size per WCAG/Requirement 24.1 */
export const TOUCH_TARGET = {
  minSize: 44, // px
  minSpacing: 8, // px
} as const;

/** Pagination defaults */
export const PAGINATION = {
  productsPerPage: 20,
  ordersPerPage: 20,
  adminOrdersPerPage: 50,
  reviewsPerPage: 10,
  galleryBatchSize: 20,
  customersPerPage: 20,
} as const;

/** Performance targets (Requirement 22) */
export const PERFORMANCE = {
  lcpTarget: 2500, // ms
  fidTarget: 100, // ms
  clsTarget: 0.1,
  lighthouseMinScore: 90,
  isrRevalidate: 60, // seconds
} as const;

/** Image constraints */
export const IMAGE_CONFIG = {
  maxProductImages: 10,
  maxImageSizeMB: 5,
  maxGalleryImageSizeMB: 10,
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
} as const;
