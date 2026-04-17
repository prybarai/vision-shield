import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Get dispute help',
  description: 'Organize what happened, generate practical dispute drafts, and get calmer next-step guidance when a contractor job goes sideways.',
  alternates: {
    canonical: absoluteUrl('/shield/rescue'),
  },
  openGraph: {
    url: absoluteUrl('/shield/rescue'),
  },
};

export default function ShieldRescueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
