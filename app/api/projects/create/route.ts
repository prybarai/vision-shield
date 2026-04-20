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
  
  // Note: project_type and skill_level columns don't exist in database
  // Using project_category and notes fields instead
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    
    // Set status based on project type
    // Extract fields that might be in params but aren't in database schema
    const paramsAny = params as any;
    const project_type = paramsAny.project_type;
    const description = paramsAny.description;
    
    // Create project data with only valid database fields
    const projectData: any = {
      location_type: params.location_type,
      project_category: params.project_category,
      style_preference: params.style_preference,
      quality_tier: params.quality_tier,
      zip_code: params.zip_code,
      status: 'draft',
    };
    
    // Add optional fields if they exist
    if (params.address) projectData.address = params.address;
    if (params.notes) projectData.notes = params.notes;
    if (params.session_id) projectData.session_id = params.session_id;
    
    // Map project_type to project_category if provided
    if (project_type && project_type !== 'custom') {
      projectData.project_category = project_type;
    }
    
    // Add description to notes if provided
    if (description) {
      projectData.notes = description;
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
