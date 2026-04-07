import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateConceptImages } from '@/lib/imageGeneration';
import { type VisionAnalysis } from '@/lib/visionAnalysis';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  notes: z.string().optional(),
  reference_image_url: z.string().url().optional(),
  analysis: z.unknown().optional(),
  count: z.number().int().min(1).max(3).optional(),
});

export const maxDuration = 300; // 5 min — OpenAI image edit can take 30-60s per image

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return input as VisionAnalysis;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const imageUrls = await generateConceptImages({
      category: params.category,
      style: params.style,
      qualityTier: params.quality_tier,
      notes: params.notes,
      referenceImageUrl: params.reference_image_url,
      analysis: getAnalysis(params.analysis),
      projectId: params.project_id,
      count: params.count ?? 3,
    });

    if (imageUrls.length > 0) {
      await supabaseAdmin
        .from('projects')
        .update({ generated_image_urls: imageUrls })
        .eq('id', params.project_id);
    }

    return NextResponse.json({ image_urls: imageUrls });
  } catch (error) {
    console.error('generate concepts error:', error);
    return NextResponse.json({ error: 'Failed to generate concepts', image_urls: [] }, { status: 500 });
  }
}
