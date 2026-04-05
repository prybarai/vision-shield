import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import QueryProvider from '@/components/providers/QueryProvider';
import PostHogProvider from '@/components/providers/PostHogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prybar — AI Home Project Planning & Contractor Verification',
  description: 'See what your home project could look like and what it might cost. Verify contractors before you hire.',
  openGraph: {
    title: 'Prybar — AI Home Project Planning',
    description: 'AI-powered home improvement planning and contractor trust verification.',
    siteName: 'Prybar',
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
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
