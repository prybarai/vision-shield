import type { Metadata } from 'next';
import EstimatorWalkthrough from '@/components/walkthrough/EstimatorWalkthrough';

export const metadata: Metadata = {
  title: 'interior painting estimator | naili',
  description: 'The proof-phase naili walkthrough for contractor-style interior painting estimates.',
};

export default function InteriorPaintEstimatorPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6">
      <EstimatorWalkthrough />
    </div>
  );
}
