/**
 * Paint & Keep - Community Stories Page
 *
 * SSR page displaying approved community stories and a submission form.
 * Stories are fetched server-side for SEO and fast initial load.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { Metadata } from 'next';

import prisma from '@/lib/prisma';
import CommunityStoriesClient from './CommunityStoriesClient';

export const metadata: Metadata = {
  title: 'Community Stories | Paint & Keep',
  description:
    'Read inspiring stories from our creative community. See amazing artwork by kids and families, and share your own Paint & Keep experience!',
  openGraph: {
    title: 'Community Stories | Paint & Keep',
    description:
      'Read inspiring stories from our creative community. See amazing artwork by kids and families, and share your own Paint & Keep experience!',
    type: 'website',
  },
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface CommunityStoryData {
  id: string;
  name: string;
  age: number;
  reviewText: string;
  photoUrl: string;
  artworkUrl: string;
  createdAt: string;
}

async function getApprovedStories(): Promise<CommunityStoryData[]> {
  try {
    const stories = await prisma.communityStory.findMany({
      where: {
        status: { in: ['APPROVED', 'FEATURED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        age: true,
        reviewText: true,
        photoUrl: true,
        artworkUrl: true,
        createdAt: true,
      },
    });

    return stories.map((story) => ({
      ...story,
      createdAt: story.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('[CommunityStories] Failed to fetch stories:', error);
    return [];
  }
}

export default async function CommunityStoriesPage() {
  const stories = await getApprovedStories();

  return <CommunityStoriesClient stories={stories} />;
}
