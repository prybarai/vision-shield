import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const schema = z.object({
  // Legacy fields (for backward compatibility)
  location_type: z.enum(['interior', 'exterior']).optional().default('interior'),
  project_category: z.string().optional().default('custom_project'),
  style_preference: z.string().optional().default('modern'),
  quality_tier: z.enum(['budget', 'mid', 'premium']).optional().default('mid'),
  address: z.string().optional(),
  notes: z.string().optional(),
  
  // Required fields
  zip_code: z.string().min(5),
  session_id: z.string().optional(),
  
  // New AI-powered flow fields
  project_type: z.enum(['diagnose', 'renovate', 'landscape', 'repair', 'design', 'custom']).optional().default('custom'),
  skill_level: z.enum(['beginner', 'handy', 'experienced', 'pro']).optional().default('handy'),
  is_video: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    
    // Set status based on project type
    const projectData = {
      ...params,
      status: params.project_type === 'custom' ? 'draft' : 'ai_processing',
    };
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
