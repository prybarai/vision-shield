import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Find vetted contractors',
  description: 'Tell naili about your project and timeline, then get matched with vetted local contractors when you are ready.',
  alternates: {
    canonical: absoluteUrl('/connect'),
  },
  openGraph: {
    url: absoluteUrl('/connect'),
  },
};

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
