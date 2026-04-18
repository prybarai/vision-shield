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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(72,199,241,0.10),_transparent_28%),linear-gradient(to_bottom,_#f8fbff,_#ffffff)] py-6 sm:py-10">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <VisionStartFlow />
      </div>
    </div>
  );
}