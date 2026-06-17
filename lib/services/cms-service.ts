/**
 * Paint & Keep - CMS Service
 *
 * Manages homepage sections and static page content without code changes.
 * Supports section CRUD, publish with validation, preview mode, and versioning.
 *
 * Sections: hero, best_sellers, about, faq
 *
 * Uses Prisma CMSContent model with JSON content storage per section.
 * Published changes reflect on storefront within 60 seconds via ISR revalidation.
 *
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8
 */

import { revalidatePath } from 'next/cache';

import prisma from '@/lib/prisma';

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface HeroCTA {
  label: string; // max 40 chars
  url: string;
}

export interface HeroContent {
  headline: string; // max 100 chars
  subheadline: string; // max 250 chars
  images: string[]; // up to 5 image URLs
  ctas: HeroCTA[]; // up to 3 CTAs
}

export interface BestSellersContent {
  productIds: string[]; // 4-12 featured product IDs
}

export interface AboutContent {
  brandStory: string; // max 5000 chars
  mission: string; // max 1000 chars
  vision: string; // max 1000 chars
  teamPhotos: string[]; // up to 20 image URLs
}

export interface FAQEntry {
  id: string;
  question: string; // max 200 chars
  answer: string; // max 2000 chars
  order: number;
}

export interface FAQContent {
  entries: FAQEntry[]; // max 50 entries
}

export type CMSSectionType = 'hero' | 'best_sellers' | 'about' | 'faq';

export type CMSSectionContent = HeroContent | BestSellersContent | AboutContent | FAQContent;

export interface CMSSection {
  id: string;
  section: string;
  content: CMSSectionContent;
  version: number;
  isPublished: boolean;
  publishedAt: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/* ─── Allowed image MIME types ─────────────────────────────────────────── */

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/* ─── Validation Functions ─────────────────────────────────────────────── */

function validateHeroContent(content: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = content as Partial<HeroContent>;

  if (!data.headline || typeof data.headline !== 'string') {
    errors.push({ field: 'headline', message: 'Headline is required' });
  } else if (data.headline.length > 100) {
    errors.push({ field: 'headline', message: 'Headline must not exceed 100 characters' });
  }

  if (!data.subheadline || typeof data.subheadline !== 'string') {
    errors.push({ field: 'subheadline', message: 'Subheadline is required' });
  } else if (data.subheadline.length > 250) {
    errors.push({ field: 'subheadline', message: 'Subheadline must not exceed 250 characters' });
  }

  if (!Array.isArray(data.images)) {
    errors.push({ field: 'images', message: 'Images must be an array' });
  } else if (data.images.length > 5) {
    errors.push({ field: 'images', message: 'Maximum 5 images allowed' });
  }

  if (!Array.isArray(data.ctas)) {
    errors.push({ field: 'ctas', message: 'CTAs must be an array' });
  } else if (data.ctas.length > 3) {
    errors.push({ field: 'ctas', message: 'Maximum 3 CTAs allowed' });
  } else {
    data.ctas.forEach((cta, index) => {
      if (!cta.label || typeof cta.label !== 'string') {
        errors.push({ field: `ctas[${index}].label`, message: 'CTA label is required' });
      } else if (cta.label.length > 40) {
        errors.push({
          field: `ctas[${index}].label`,
          message: 'CTA label must not exceed 40 characters',
        });
      }
      if (!cta.url || typeof cta.url !== 'string') {
        errors.push({ field: `ctas[${index}].url`, message: 'CTA URL is required' });
      }
    });
  }

  return errors;
}

function validateBestSellersContent(content: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = content as Partial<BestSellersContent>;

  if (!Array.isArray(data.productIds)) {
    errors.push({ field: 'productIds', message: 'Product IDs must be an array' });
  } else if (data.productIds.length < 4) {
    errors.push({ field: 'productIds', message: 'Minimum 4 products required' });
  } else if (data.productIds.length > 12) {
    errors.push({ field: 'productIds', message: 'Maximum 12 products allowed' });
  }

  return errors;
}

function validateAboutContent(content: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = content as Partial<AboutContent>;

  if (!data.brandStory || typeof data.brandStory !== 'string') {
    errors.push({ field: 'brandStory', message: 'Brand story is required' });
  } else if (data.brandStory.length > 5000) {
    errors.push({ field: 'brandStory', message: 'Brand story must not exceed 5000 characters' });
  }

  if (!data.mission || typeof data.mission !== 'string') {
    errors.push({ field: 'mission', message: 'Mission is required' });
  } else if (data.mission.length > 1000) {
    errors.push({ field: 'mission', message: 'Mission must not exceed 1000 characters' });
  }

  if (!data.vision || typeof data.vision !== 'string') {
    errors.push({ field: 'vision', message: 'Vision is required' });
  } else if (data.vision.length > 1000) {
    errors.push({ field: 'vision', message: 'Vision must not exceed 1000 characters' });
  }

  if (Array.isArray(data.teamPhotos) && data.teamPhotos.length > 20) {
    errors.push({ field: 'teamPhotos', message: 'Maximum 20 team photos allowed' });
  }

  return errors;
}

function validateFAQContent(content: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = content as Partial<FAQContent>;

  if (!Array.isArray(data.entries)) {
    errors.push({ field: 'entries', message: 'FAQ entries must be an array' });
  } else {
    if (data.entries.length > 50) {
      errors.push({ field: 'entries', message: 'Maximum 50 FAQ entries allowed' });
    }
    data.entries.forEach((entry, index) => {
      if (!entry.question || typeof entry.question !== 'string') {
        errors.push({ field: `entries[${index}].question`, message: 'Question is required' });
      } else if (entry.question.length > 200) {
        errors.push({
          field: `entries[${index}].question`,
          message: 'Question must not exceed 200 characters',
        });
      }
      if (!entry.answer || typeof entry.answer !== 'string') {
        errors.push({ field: `entries[${index}].answer`, message: 'Answer is required' });
      } else if (entry.answer.length > 2000) {
        errors.push({
          field: `entries[${index}].answer`,
          message: 'Answer must not exceed 2000 characters',
        });
      }
    });
  }

  return errors;
}

/* ─── CMS Service ──────────────────────────────────────────────────────── */

export class CMSService {
  /**
   * Get all CMS sections.
   */
  static async getAllSections(): Promise<CMSSection[]> {
    const sections = await prisma.cMSContent.findMany({
      orderBy: { section: 'asc' },
    });

    return sections.map((s) => ({
      id: s.id,
      section: s.section,
      content: s.content as unknown as CMSSectionContent,
      version: s.version,
      isPublished: s.isPublished,
      publishedAt: s.publishedAt?.toISOString() || null,
      updatedBy: s.updatedBy,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  /**
   * Get a single CMS section by name.
   */
  static async getSection(section: CMSSectionType): Promise<CMSSection | null> {
    const record = await prisma.cMSContent.findUnique({
      where: { section },
    });

    if (!record) return null;

    return {
      id: record.id,
      section: record.section,
      content: record.content as unknown as CMSSectionContent,
      version: record.version,
      isPublished: record.isPublished,
      publishedAt: record.publishedAt?.toISOString() || null,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Update a CMS section's content (draft save, does not publish).
   * Increments version on each update.
   */
  static async updateSection(
    section: CMSSectionType,
    content: CMSSectionContent,
    updatedBy: string
  ): Promise<CMSSection> {
    const existing = await prisma.cMSContent.findUnique({
      where: { section },
    });

    let record;
    if (existing) {
      record = await prisma.cMSContent.update({
        where: { section },
        data: {
          content: content as unknown as Record<string, unknown>,
          version: existing.version + 1,
          isPublished: false,
          updatedBy,
        },
      });
    } else {
      record = await prisma.cMSContent.create({
        data: {
          section,
          content: content as unknown as Record<string, unknown>,
          version: 1,
          isPublished: false,
          updatedBy,
        },
      });
    }

    return {
      id: record.id,
      section: record.section,
      content: record.content as unknown as CMSSectionContent,
      version: record.version,
      isPublished: record.isPublished,
      publishedAt: record.publishedAt?.toISOString() || null,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Publish a CMS section after validation.
   * Rejects if content has missing required fields or exceeds limits.
   * On success, triggers ISR revalidation for storefront pages.
   */
  static async publishSection(
    section: CMSSectionType,
    updatedBy: string
  ): Promise<{ success: boolean; errors?: ValidationError[]; section?: CMSSection }> {
    const existing = await prisma.cMSContent.findUnique({
      where: { section },
    });

    if (!existing) {
      return {
        success: false,
        errors: [{ field: 'section', message: `Section "${section}" does not exist` }],
      };
    }

    // Validate content before publishing
    const errors = CMSService.validateContent(section, existing.content);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Mark as published
    const record = await prisma.cMSContent.update({
      where: { section },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        updatedBy,
      },
    });

    // Trigger ISR revalidation for affected storefront pages
    CMSService.revalidateAffectedPaths(section);

    return {
      success: true,
      section: {
        id: record.id,
        section: record.section,
        content: record.content as unknown as CMSSectionContent,
        version: record.version,
        isPublished: record.isPublished,
        publishedAt: record.publishedAt?.toISOString() || null,
        updatedBy: record.updatedBy,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Get preview data for a section (returns current draft content as it would appear).
   */
  static async getPreview(section: CMSSectionType): Promise<{
    content: CMSSectionContent | null;
    isPublished: boolean;
    lastUpdated: string | null;
  }> {
    const record = await prisma.cMSContent.findUnique({
      where: { section },
    });

    if (!record) {
      return { content: null, isPublished: false, lastUpdated: null };
    }

    return {
      content: record.content as unknown as CMSSectionContent,
      isPublished: record.isPublished,
      lastUpdated: record.updatedAt.toISOString(),
    };
  }

  /**
   * Validate content for a specific section type.
   */
  static validateContent(section: CMSSectionType, content: unknown): ValidationError[] {
    switch (section) {
      case 'hero':
        return validateHeroContent(content);
      case 'best_sellers':
        return validateBestSellersContent(content);
      case 'about':
        return validateAboutContent(content);
      case 'faq':
        return validateFAQContent(content);
      default:
        return [{ field: 'section', message: `Unknown section type: ${section}` }];
    }
  }

  /**
   * Validate an image URL extension (for upload validation on the client).
   */
  static isValidImageExtension(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  }

  /**
   * Max image file size in bytes.
   */
  static get maxImageSizeBytes(): number {
    return MAX_IMAGE_SIZE_BYTES;
  }

  /**
   * Trigger ISR revalidation for paths affected by the published section.
   * Ensures storefront reflects changes within 60 seconds.
   */
  private static revalidateAffectedPaths(section: CMSSectionType): void {
    try {
      switch (section) {
        case 'hero':
        case 'best_sellers':
          revalidatePath('/');
          break;
        case 'about':
          revalidatePath('/about');
          break;
        case 'faq':
          revalidatePath('/contact');
          break;
      }
    } catch (error) {
      // revalidatePath may fail outside of a request context (e.g. in tests)
      console.warn('[CMSService] revalidatePath failed:', error);
    }
  }
}

export default CMSService;
