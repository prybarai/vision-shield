import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Start your project',
  description: 'Upload a photo, describe the project, and get a planning-grade brief and estimate from naili.',
  alternates: {
    canonical: absoluteUrl('/vision/start'),
  },
  openGraph: {
    url: absoluteUrl('/vision/start'),
  },
};

export default function VisionStartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
