/**
 * Paint & Keep - Admin CMS API (All Sections)
 *
 * GET   /api/admin/cms - List all CMS sections with their content and publish status
 * PATCH /api/admin/cms - Update a section's content (requires section name in body)
 *
 * Access: super_admin, marketing roles
 *
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.7
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import { CMSService, type CMSSectionType, type CMSSectionContent } from '@/lib/services/cms-service';

const VALID_SECTIONS: CMSSectionType[] = ['hero', 'best_sellers', 'about', 'faq'];

/**
 * GET /api/admin/cms
 * Returns all CMS sections with their current content and status.
 */
const listSections: AuthenticatedHandler = async () => {
  try {
    const sections = await CMSService.getAllSections();

    return NextResponse.json({
      sections,
      availableSections: VALID_SECTIONS,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PATCH /api/admin/cms
 * Update a section's content (draft save). Does not publish.
 *
 * Body: { section: string, content: object }
 */
const updateSection: AuthenticatedHandler = async (request) => {
  try {
    const body = await request.json();
    const { section, content } = body;

    if (!section || typeof section !== 'string') {
      throw badRequest('Section name is required');
    }

    if (!VALID_SECTIONS.includes(section as CMSSectionType)) {
      throw badRequest(`Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}`);
    }

    if (!content || typeof content !== 'object') {
      throw badRequest('Content object is required');
    }

    const updatedBy = request.session.userId;

    const updated = await CMSService.updateSection(
      section as CMSSectionType,
      content as CMSSectionContent,
      updatedBy
    );

    return NextResponse.json({ section: updated });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAdminRequired(listSections, ['super_admin', 'marketing']);
export const PATCH = withAdminRequired(updateSection, ['super_admin', 'marketing']);
