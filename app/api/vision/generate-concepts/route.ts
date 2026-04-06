import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateConceptImages } from '@/lib/imageGeneration';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  notes: z.string().optional(),
  reference_image_url: z.string().url().optional(),
});

export const maxDuration = 300; // 5 min — OpenAI image edit can take 30-60s per image

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
      projectId: params.project_id,
      count: 3,
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
