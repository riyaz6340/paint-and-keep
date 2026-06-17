/**
 * Paint & Keep - Instagram Sync API Route
 *
 * POST /api/instagram/sync - Sync/upload Instagram posts.
 *
 * This endpoint serves as:
 * 1. A scheduled sync job (every 6 hours) — placeholder for actual Instagram Graph API
 *    integration which requires Meta developer account approval.
 * 2. Manual upload support for admins to add Instagram posts when sync is unavailable.
 *
 * Manual Upload Body (JSON):
 * - imageUrl: string (required) - URL or path of the post image
 * - caption: string (required) - Post caption (max 2200 chars)
 * - username: string (required) - Instagram username (max 100 chars)
 * - postUrl: string (optional) - Original Instagram post URL
 * - likeCount: number (optional, default 0) - Like count
 * - postDate: string (optional, default now) - ISO date of the post
 *
 * Scheduled Sync Body (JSON):
 * - action: "sync" - Triggers the sync job
 * - secret: string - Cron secret for authentication
 *
 * All newly synced/uploaded posts receive "pending" moderation status.
 *
 * Requirements: 9.3, 9.5, 9.6
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, badRequest, unauthorized } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { sendNotificationAsync } from '@/lib/notifications';

// Cron secret for scheduled sync jobs (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || '';

// Admin emails for sync failure notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintandkeep.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle scheduled sync action
    if (body.action === 'sync') {
      return handleScheduledSync(body.secret);
    }

    // Handle manual upload (admin)
    return handleManualUpload(body);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Handle scheduled sync job from cron.
 * Since Instagram Graph API requires Meta developer approval (not free),
 * this is a placeholder that logs the attempt and notifies admin if setup is needed.
 */
async function handleScheduledSync(secret: string): Promise<NextResponse> {
  // Validate cron secret
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    throw unauthorized('Invalid sync secret');
  }

  try {
    // Placeholder: In production, this would call the Instagram Graph API
    // to fetch posts from #PaintAndKeep and @paintandkeep
    //
    // const instagramPosts = await fetchFromInstagramAPI();
    // for (const post of instagramPosts) {
    //   await prisma.instagramPost.upsert({
    //     where: { postUrl: post.permalink },
    //     create: {
    //       postUrl: post.permalink,
    //       imageUrl: post.media_url,
    //       caption: post.caption || '',
    //       username: post.username,
    //       likeCount: post.like_count || 0,
    //       postDate: new Date(post.timestamp),
    //       status: 'PENDING',
    //       isFeatured: false,
    //     },
    //     update: {
    //       likeCount: post.like_count || 0,
    //     },
    //   });
    // }

    // For now, log the sync attempt and return success
    console.log('[Instagram Sync] Scheduled sync triggered at:', new Date().toISOString());
    console.log('[Instagram Sync] Note: Instagram Graph API integration pending Meta developer approval.');

    return NextResponse.json({
      success: true,
      message: 'Sync job executed. Instagram Graph API integration pending Meta developer approval. Use manual upload to add posts.',
      syncedAt: new Date().toISOString(),
      postsAdded: 0,
    });
  } catch (error) {
    // Notify admin of sync failure
    console.error('[Instagram Sync] Sync failed:', error);

    sendNotificationAsync({
      type: 'ADMIN_MODERATION',
      recipient: ADMIN_EMAIL,
      data: {
        contentType: 'Instagram Sync Failure',
        submittedBy: 'System (Cron)',
        submittedAt: new Date().toISOString(),
      },
    });

    // Return gracefully — the Instagram Wall still shows last approved posts (Requirement 9.6)
    return NextResponse.json(
      {
        success: false,
        message: 'Instagram sync failed. Admin has been notified. The wall continues to display previously approved posts.',
        syncedAt: new Date().toISOString(),
        postsAdded: 0,
      },
      { status: 200 } // 200 because the system handles it gracefully
    );
  }
}

/**
 * Handle manual upload of Instagram posts by admins.
 * Supports adding posts when automatic sync is unavailable (Requirement 9.5).
 */
async function handleManualUpload(body: Record<string, unknown>): Promise<NextResponse> {
  // Validate required fields
  const { imageUrl, caption, username, postUrl, likeCount, postDate } = body;

  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
    throw badRequest('imageUrl is required');
  }

  if (!caption || typeof caption !== 'string' || caption.trim().length === 0) {
    throw badRequest('caption is required');
  }

  if (typeof caption === 'string' && caption.length > 2200) {
    throw badRequest('caption must be 2200 characters or less');
  }

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    throw badRequest('username is required');
  }

  if (typeof username === 'string' && username.length > 100) {
    throw badRequest('username must be 100 characters or less');
  }

  // Validate optional fields
  const parsedLikeCount = typeof likeCount === 'number' ? Math.max(0, Math.floor(likeCount)) : 0;

  let parsedPostDate: Date;
  if (postDate && typeof postDate === 'string') {
    parsedPostDate = new Date(postDate);
    if (isNaN(parsedPostDate.getTime())) {
      throw badRequest('postDate must be a valid ISO date string');
    }
  } else {
    parsedPostDate = new Date();
  }

  // Create the Instagram post with PENDING status
  const post = await prisma.instagramPost.create({
    data: {
      postUrl: typeof postUrl === 'string' ? postUrl.trim() : null,
      imageUrl: (imageUrl as string).trim(),
      caption: (caption as string).trim(),
      username: (username as string).trim().replace(/^@/, ''), // Remove leading @ if present
      likeCount: parsedLikeCount,
      postDate: parsedPostDate,
      status: 'PENDING',
      isFeatured: false,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Instagram post uploaded successfully. It is pending moderation.',
      post: {
        id: post.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        username: post.username,
        postDate: post.postDate.toISOString(),
        likeCount: post.likeCount,
        status: post.status,
      },
    },
    { status: 201 }
  );
}
