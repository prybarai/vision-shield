import type { Metadata } from 'next';
import VisionStartFlow from '@/components/vision/VisionStartFlow';

export const metadata: Metadata = {
  title: 'Start your project',
  description: 'Upload a real photo, get a grounded estimate, and build a contractor-ready plan.',
};

export default function VisionStartPage() {
  return <VisionStartFlow />;
}
