import type { Metadata } from 'next';
import VisionStartFlow from '@/components/vision/VisionStartFlow';
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

export default function VisionStartPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10">
      <VisionStartFlow />
    </div>
  );
}
