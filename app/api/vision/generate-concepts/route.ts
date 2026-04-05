import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateConceptImages } from '@/lib/replicate';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const imageUrls = await generateConceptImages({
      category: params.category,
      style: params.style,
      qualityTier: params.quality_tier,
      count: 3,
    });

    await supabaseAdmin
      .from('projects')
      .update({ generated_image_urls: imageUrls })
      .eq('id', params.project_id);

    return NextResponse.json({ image_urls: imageUrls });
  } catch (error) {
    console.error('generate concepts error:', error);
    return NextResponse.json({ error: 'Failed to generate concepts', image_urls: [] }, { status: 500 });
  }
}
