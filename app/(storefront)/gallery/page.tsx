import type { Metadata } from 'next';

import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
  title: 'Customer Gallery | Paint & Keep',
  description:
    'Browse inspiring artwork created by Paint & Keep customers. See creative masterpieces from kids, families, and art enthusiasts of all ages.',
  openGraph: {
    title: 'Customer Gallery | Paint & Keep',
    description:
      'Browse inspiring artwork created by Paint & Keep customers. See creative masterpieces from kids, families, and art enthusiasts of all ages.',
    type: 'website',
  },
};

export default function GalleryPage() {
  return <GalleryClient />;
}
