import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import VisionStartFlow from '@/components/vision/VisionStartFlow';

export const metadata: Metadata = {
  title: 'Start Your Project — Naili',
  description:
    'Upload a photo, answer a few questions, and get an AI-powered renovation plan with cost estimates and design concepts.',
};

type PageProps = {
  searchParams?: {
    from?: string;
    zip?: string;
    category?: string;
    style?: string;
    quality?: string;
    notes?: string;
    image?: string;
  };
};

export default function VisionStartPage({ searchParams }: PageProps) {
  return (
    <main className="min-h-screen bg-canvas">
      <Nav />
      <section className="px-4 pb-16 pt-28 sm:px-6 md:pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl tracking-tight text-ink mb-3">
              Complete your project details
            </h1>
            <p className="text-lg text-ink-600">
              A few quick questions to help our AI create the best plan for your
              space
            </p>
          </div>
          <VisionStartFlow initialPrefill={searchParams} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
