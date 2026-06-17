/**
 * Paint & Keep - Admin Bulk Product Upload API Route
 *
 * POST /api/admin/products/bulk-upload - Upload CSV/Excel for bulk product creation
 *
 * Validates each row, skips invalid rows, and reports a summary with per-row error reasons.
 * Max file size: 10MB, max rows: 1000.
 *
 * CSV Format (headers required):
 * name,description,price,category,ageGroup,difficultyLevel,stock,seoTitle,seoDescription
 *
 * Requirements: 15.2, 15.3
 */

import { NextResponse } from 'next/server';
import { withAdminRequired, type AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError, badRequest } from '@/lib/api-error';
import { ProductService, type CreateProductData } from '@/lib/services/product-service';
import prisma from '@/lib/prisma';
import type { AgeGroup, DifficultyLevel } from '@prisma/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;
const VALID_AGE_GROUPS: AgeGroup[] = ['AGES_4_6', 'AGES_7_9', 'AGES_10_12', 'TEENS', 'ADULTS', 'FAMILY'];
const VALID_DIFFICULTY_LEVELS: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

interface RowError {
  row: number;
  errors: string[];
  data?: Record<string, string>;
}

interface BulkUploadResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: RowError[];
  createdProducts: { id: string; name: string; slug: string }[];
}

/**
 * Parse CSV content into rows of key-value pairs.
 */
function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  // Parse header line
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate a single product row.
 */
function validateRow(
  row: Record<string, string>,
  rowIndex: number,
  categoryMap: Map<string, string>
): { valid: boolean; errors: string[]; data?: CreateProductData } {
  const errors: string[] = [];

  // Name validation
  const name = row.name?.trim();
  if (!name) {
    errors.push('Name is required');
  } else if (name.length > 200) {
    errors.push('Name must not exceed 200 characters');
  }

  // Description validation
  const description = row.description?.trim();
  if (!description) {
    errors.push('Description is required');
  } else if (description.length > 5000) {
    errors.push('Description must not exceed 5000 characters');
  }

  // Price validation
  const price = parseFloat(row.price);
  if (isNaN(price) || price < 0.01 || price > 999999.99) {
    errors.push('Price must be between 0.01 and 999,999.99');
  }

  // Category validation (match by name, case-insensitive)
  const categoryName = row.category?.trim().toLowerCase();
  const categoryId = categoryName ? categoryMap.get(categoryName) : undefined;
  if (!categoryName) {
    errors.push('Category is required');
  } else if (!categoryId) {
    errors.push(`Category "${row.category}" not found`);
  }

  // Age group validation
  const ageGroup = row.agegroup?.trim() || row.age_group?.trim() || row['age group']?.trim();
  if (!ageGroup) {
    errors.push('Age group is required');
  } else if (!VALID_AGE_GROUPS.includes(ageGroup.toUpperCase() as AgeGroup)) {
    errors.push(`Age group must be one of: ${VALID_AGE_GROUPS.join(', ')}`);
  }

  // Difficulty level validation
  const difficulty = row.difficultylevel?.trim() || row.difficulty_level?.trim() || row.difficulty?.trim() || row['difficulty level']?.trim();
  if (!difficulty) {
    errors.push('Difficulty level is required');
  } else if (!VALID_DIFFICULTY_LEVELS.includes(difficulty.toUpperCase() as DifficultyLevel)) {
    errors.push(`Difficulty level must be one of: ${VALID_DIFFICULTY_LEVELS.join(', ')}`);
  }

  // Stock validation (optional, defaults to 0)
  let stock = 0;
  if (row.stock) {
    stock = parseInt(row.stock, 10);
    if (isNaN(stock) || stock < 0 || stock > 999999) {
      errors.push('Stock must be between 0 and 999,999');
    }
  }

  // SEO Title validation (optional)
  const seoTitle = row.seotitle?.trim() || row.seo_title?.trim() || row['seo title']?.trim();
  if (seoTitle && seoTitle.length > 60) {
    errors.push('SEO title must not exceed 60 characters');
  }

  // SEO Description validation (optional)
  const seoDescription = row.seodescription?.trim() || row.seo_description?.trim() || row['seo description']?.trim();
  if (seoDescription && seoDescription.length > 160) {
    errors.push('SEO description must not exceed 160 characters');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      name: name!,
      description: description!,
      price,
      categoryId: categoryId!,
      ageGroup: ageGroup!.toUpperCase() as AgeGroup,
      difficultyLevel: difficulty!.toUpperCase() as DifficultyLevel,
      stock,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    },
  };
}

/**
 * POST /api/admin/products/bulk-upload
 * Accept CSV file, validate rows, create valid products, report summary.
 */
export const POST = withAdminRequired(
  async (request: AuthenticatedRequest) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        throw badRequest('No file provided. Please upload a CSV file.');
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw badRequest('File size exceeds 10MB limit.');
      }

      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        throw badRequest('Only CSV and Excel files are accepted.');
      }

      // Read file content
      const content = await file.text();

      if (!content.trim()) {
        throw badRequest('File is empty.');
      }

      // Parse CSV
      const { headers, rows } = parseCSV(content);

      if (headers.length === 0 || rows.length === 0) {
        throw badRequest('File must contain a header row and at least one data row.');
      }

      // Check required headers
      const requiredHeaders = ['name', 'description', 'price', 'category'];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        throw badRequest(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      // Enforce max rows
      if (rows.length > MAX_ROWS) {
        throw badRequest(`File exceeds maximum of ${MAX_ROWS} rows. Found ${rows.length} rows.`);
      }

      // Load all categories for mapping
      const categories = await prisma.category.findMany({
        select: { id: true, name: true },
      });
      const categoryMap = new Map(
        categories.map((c) => [c.name.toLowerCase(), c.id])
      );

      // Process rows
      const result: BulkUploadResult = {
        totalRows: rows.length,
        successCount: 0,
        failedCount: 0,
        errors: [],
        createdProducts: [],
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const validation = validateRow(row, i + 2, categoryMap); // +2 for 1-indexed + header row

        if (!validation.valid) {
          result.failedCount++;
          result.errors.push({
            row: i + 2, // 1-indexed row number (header is row 1)
            errors: validation.errors,
            data: row,
          });
          continue;
        }

        try {
          const product = await ProductService.createProduct(validation.data!);
          result.successCount++;
          result.createdProducts.push({
            id: product.id,
            name: product.name,
            slug: product.slug,
          });
        } catch (error) {
          result.failedCount++;
          result.errors.push({
            row: i + 2,
            errors: [error instanceof Error ? error.message : 'Failed to create product'],
            data: row,
          });
        }
      }

      return NextResponse.json(result, {
        status: result.failedCount > 0 && result.successCount > 0 ? 207 : result.successCount > 0 ? 201 : 400,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  ['super_admin', 'operations']
);
