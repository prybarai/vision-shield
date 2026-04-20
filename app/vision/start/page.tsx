import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import SimpleVisionFlow from '@/components/vision/SimpleVisionFlow';

export const metadata: Metadata = {
  title: 'Start your project',
  description: 'Upload a real photo, get a grounded estimate, and build a contractor-ready plan.',
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
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Complete your project details</h1>
            <p className="text-lg text-gray-600">A few quick questions to help our AI create the best plan for you</p>
          </div>
          <SimpleVisionFlow initialPrefill={searchParams} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
