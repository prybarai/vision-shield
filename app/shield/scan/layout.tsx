import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Scan a quote or contract',
  description: 'Paste a quote or contract and get a plain-English read on red flags, missing protections, and risky payment terms.',
  alternates: {
    canonical: absoluteUrl('/shield/scan'),
  },
  openGraph: {
    url: absoluteUrl('/shield/scan'),
  },
};

export default function ShieldScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
