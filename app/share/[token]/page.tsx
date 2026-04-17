import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrencyRange } from '@/lib/utils';
import Disclaimer from '@/components/ui/Disclaimer';
import Badge from '@/components/ui/Badge';
import { DISCLAIMERS } from '@/lib/disclaimers';
import type { Project, Estimate } from '@/types';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Shared project',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('share_token', token)
    .single();

  if (!project) notFound();

  const p = project as Project;

  const { data: estimate } = await supabaseAdmin
    .from('estimates')
    .select('*')
    .eq('project_id', p.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const e = estimate as Estimate | null;

  const categoryLabel = p.project_category.replace(/_/g, ' ');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1 text-xs text-slate-400 mb-4">
          Shared via naili vision
        </div>
        <div className="flex justify-center gap-2 mb-3">
          <Badge variant="blue" className="capitalize">{p.quality_tier} tier</Badge>
          <Badge variant="gray" className="capitalize">{categoryLabel}</Badge>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 capitalize mb-2">{categoryLabel} Project</h1>
        {p.zip_code && <p className="text-slate-500">ZIP: {p.zip_code}</p>}
      </div>

      {/* Images */}
      {p.generated_image_urls?.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {p.generated_image_urls.map((url: string, i: number) => (
              <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src={url}
                  alt={`Concept ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimate */}
      {e && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">What this should cost</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Low</div>
              <div className="text-xl font-bold text-slate-700">${e.low_estimate.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-[#eef8ff] rounded-xl border-2 border-[#bdefff]">
              <div className="text-xs text-[#1f7cf7] font-medium mb-1">Mid</div>
              <div className="text-xl font-bold text-[#0f5fc6]">${e.mid_estimate.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">High</div>
              <div className="text-xl font-bold text-slate-700">${e.high_estimate.toLocaleString()}</div>
            </div>
          </div>
          <p className="text-center text-slate-600 font-medium">
            {formatCurrencyRange(e.low_estimate, e.high_estimate)}
          </p>
        </div>
      )}

      <Disclaimer text={DISCLAIMERS.estimate} className="mb-6" />

      {/* CTA */}
      <div className="bg-[#1f7cf7] rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Plan your own project with naili</h2>
        <p className="text-[#eef8ff] mb-6">Get AI design concepts and a cost estimate for your home project — free to start.</p>
        <Link
          href="/vision/start"
          className="inline-flex items-center gap-2 bg-white text-[#1f7cf7] hover:bg-[#eef8ff] font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Start my project
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
