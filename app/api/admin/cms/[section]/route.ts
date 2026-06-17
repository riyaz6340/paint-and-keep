/**
 * Paint & Keep - Admin CMS Section API (Individual Section)
 *
 * GET /api/admin/cms/[section] - Get a specific section's content and preview
 * PUT /api/admin/cms/[section] - Update and optionally publish a section
 *
 * Access: super_admin, marketing roles
 *
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.7, 28.8
 */

import { NextResponse } from 'next/server';

import { handleApiError, badRequest, notFound } from '@/lib/api-error';
import { withAdminRequired, type AuthenticatedHandler } from '@/lib/auth-middleware';
import { CMSService, type CMSSectionType, type CMSSectionContent } from '@/lib/services/cms-service';

const VALID_SECTIONS: CMSSectionType[] = ['hero', 'best_sellers', 'about', 'faq'];

function validateSectionParam(section: string): CMSSectionType {
  if (!VALID_SECTIONS.includes(section as CMSSectionType)) {
    throw badRequest(`Invalid section "${section}". Must be one of: ${VALID_SECTIONS.join(', ')}`);
  }
  return section as CMSSectionType;
}

/**
 * GET /api/admin/cms/[section]
 * Returns a specific section with content, version, and publish status.
 * Also includes preview data showing how changes would appear.
 */
const getSection: AuthenticatedHandler = async (request, context) => {
  try {
    const sectionParam = context?.params?.section;
    if (!sectionParam) {
      throw badRequest('Section parameter is required');
    }

    const sectionType = validateSectionParam(sectionParam);
    const section = await CMSService.getSection(sectionType);

    if (!section) {
      // Return empty template for sections that haven't been created yet
      return NextResponse.json({
        section: {
          section: sectionType,
          content: null,
          version: 0,
          isPublished: false,
          publishedAt: null,
          updatedBy: null,
        },
        preview: {
          content: null,
          isPublished: false,
          lastUpdated: null,
        },
      });
    }

    const preview = await CMSService.getPreview(sectionType);

    return NextResponse.json({
      section,
      preview,
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PUT /api/admin/cms/[section]
 * Update a section's content and optionally publish.
 *
 * Body: { content: object, publish?: boolean }
 *
 * If publish is true, validates content before publishing.
 * Returns validation errors if content is invalid.
 */
const putSection: AuthenticatedHandler = async (request, context) => {
  try {
    const sectionParam = context?.params?.section;
    if (!sectionParam) {
      throw badRequest('Section parameter is required');
    }

    const sectionType = validateSectionParam(sectionParam);
    const body = await request.json();
    const { content, publish } = body;

    if (!content || typeof content !== 'object') {
      throw badRequest('Content object is required');
    }

    const updatedBy = request.session.userId;

    // Save the content (draft)
    const updated = await CMSService.updateSection(
      sectionType,
      content as CMSSectionContent,
      updatedBy
    );

    // If publish is requested, validate and publish
    if (publish === true) {
      const publishResult = await CMSService.publishSection(sectionType, updatedBy);

      if (!publishResult.success) {
        return NextResponse.json(
          {
            section: updated,
            published: false,
            validationErrors: publishResult.errors,
            message: 'Content saved but could not be published due to validation errors',
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        section: publishResult.section,
        published: true,
        message: 'Content saved and published successfully. Changes will reflect within 60 seconds.',
      });
    }

    return NextResponse.json({
      section: updated,
      published: false,
      message: 'Content saved as draft',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAdminRequired(getSection, ['super_admin', 'marketing']);
export const PUT = withAdminRequired(putSection, ['super_admin', 'marketing']);
