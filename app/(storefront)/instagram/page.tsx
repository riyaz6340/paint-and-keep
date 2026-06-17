import { Metadata } from 'next';

import { prisma } from '@/lib/prisma';

import InstagramWallClient from './InstagramWallClient';

export const metadata: Metadata = {
  title: 'Instagram Wall | Paint & Keep',
  description:
    'See what our community is creating! Browse curated Instagram posts from the #PaintAndKeep community.',
};

// Revalidate every 5 minutes for fresh content
export const revalidate = 300;

export interface InstagramPostItem {
  id: string;
  imageUrl: string;
  caption: string;
  username: string;
  postDate: string;
  likeCount: number;
  postUrl: string | null;
  isFeatured: boolean;
}

async function getApprovedPosts(): Promise<InstagramPostItem[]> {
  const posts = await prisma.instagramPost.findMany({
    where: {
      status: {
        in: ['APPROVED', 'FEATURED'],
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { postDate: 'desc' }],
    take: 20,
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

  return posts.map((post) => ({
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    username: post.username,
    postDate: post.postDate.toISOString(),
    likeCount: post.likeCount,
    postUrl: post.postUrl,
    isFeatured: post.isFeatured,
  }));
}

export default async function InstagramPage() {
  const posts = await getApprovedPosts();
  const featuredPosts = posts.filter((p) => p.isFeatured);
  const regularPosts = posts.filter((p) => !p.isFeatured);

  return (
    <InstagramWallClient
      featuredPosts={featuredPosts}
      regularPosts={regularPosts}
    />
  );
}
