/**
 * Paint & Keep - Instagram API Route
 *
 * GET /api/instagram - List approved Instagram posts.
 * Returns featured posts first, then non-featured, all ordered by post date descending.
 * Maximum 20 posts returned.
 *
 * Query Parameters:
 * - limit: max number of posts to return (default 20, max 20)
 * - status: filter by moderation status (default: approved + featured)
 *
 * Requirements: 9.1, 9.2, 9.7
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limitStr = searchParams.get('limit') || '20';
    const limit = Math.min(20, Math.max(1, parseInt(limitStr, 10) || 20));

    // Fetch approved and featured posts, ordered by: featured first, then by post date descending
    const posts = await prisma.instagramPost.findMany({
      where: {
        status: {
          in: ['APPROVED', 'FEATURED'],
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { postDate: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        postUrl: true,
        imageUrl: true,
        caption: true,
        username: true,
        likeCount: true,
        postDate: true,
        isFeatured: true,
      },
    });

    // Format response
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      username: post.username,
      postDate: post.postDate.toISOString(),
      likeCount: post.likeCount,
      postUrl: post.postUrl,
      isFeatured: post.isFeatured,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      total: formattedPosts.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
