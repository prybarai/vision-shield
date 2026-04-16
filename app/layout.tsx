import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import QueryProvider from '@/components/providers/QueryProvider';
import PostHogProvider from '@/components/providers/PostHogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'naili — Nail the vision. Know the cost.',
    template: '%s | naili',
  },
  description:
    'naili helps homeowners plan home projects with confidence — AI-powered estimates, contractor verification, and contract protection. Nail it before anyone shows up.',
  keywords: [
    'home renovation estimate',
    'contractor verification',
    'home project planning',
    'AI home estimate',
    'how much does renovation cost',
    'find trusted contractor',
    'naili',
  ],
  metadataBase: new URL('https://naili.ai'),
  alternates: {
    canonical: 'https://naili.ai',
  },
  openGraph: {
    siteName: 'naili',
    title: 'naili — Nail the vision. Know the cost.',
    description: 'AI-powered home project planning. Know what it costs, trust who you hire.',
    url: 'https://naili.ai',
    images: ['/og-naili.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'naili — Nail the vision. Know the cost.',
    description: 'AI-powered home project planning. Know what it costs, trust who you hire.',
    images: ['/og-naili.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
        <PostHogProvider>
          <QueryProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
