import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const schema = z.object({
  project_id: z.string().uuid(),
  project_category: z.string().optional(),
  style_preference: z.string().optional(),
  quality_tier: z.enum(['budget', 'mid', 'premium']).optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    
    const { project_id, ...updateData } = params;
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', project_id)
      .select()
      .single();
      
    if (error) throw error;
    
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}