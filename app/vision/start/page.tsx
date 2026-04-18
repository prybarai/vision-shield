import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import UploadStage from '@/components/UploadStage';

export const metadata: Metadata = {
  title: 'Start your project',
  description: 'Upload a photo, choose a direction, and build your Naili plan.',
};

export default function VisionStartPage() {
  return (
    <main className="relative z-10 bg-canvas min-h-screen">
      <Nav />
      <section className="pt-32 md:pt-40 pb-4 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="ai-pulse" />
            <span className="mono-label">naili vision</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight text-ink leading-[1.02] max-w-3xl">
            Start with a photo,
            <span className="italic text-signature"> leave with a plan.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-600 max-w-2xl">
            Naili reads the room, proposes a direction, and helps you decide whether to DIY it or hand it to the right pro.
          </p>
        </div>
      </section>
      <UploadStage />
      <Footer />
    </main>
  );
}
