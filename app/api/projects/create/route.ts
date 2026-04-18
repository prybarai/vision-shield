import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const schema = z.object({
  location_type: z.enum(['interior', 'exterior']),
  project_category: z.string(),
  zip_code: z.string().min(5),
  style_preference: z.string(),
  quality_tier: z.enum(['budget', 'mid', 'premium']),
  address: z.string().optional(),
  notes: z.string().optional(),
  session_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(params)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
