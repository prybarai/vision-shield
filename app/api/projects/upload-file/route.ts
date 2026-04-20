import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string;
    const projectType = formData.get('project_type') as string;
    const skillLevel = formData.get('skill_level') as string;
    const description = formData.get('description') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and project ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime'
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image or video.' },
        { status: 400 }
      );
    }

    // Check file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 20MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${projectId}_${timestamp}.${fileExtension}`;
    const filePath = `projects/${projectId}/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage - use project-images bucket (not project-files)
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('project-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('project-images')
      .getPublicUrl(filePath);

    // Update project with file URL and additional info
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (file.type.includes('image')) {
      updateData.uploaded_image_urls = [publicUrl];
      updateData.is_video = false;
    } else if (file.type.includes('video')) {
      updateData.uploaded_video_urls = [publicUrl];
      updateData.is_video = true;
    }

    // Update project type and skill level if provided
    if (projectType) {
      updateData.project_type = projectType;
    }
    if (skillLevel) {
      updateData.skill_level = skillLevel;
    }
    if (description) {
      updateData.description = description;
    }

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.error('Project update error:', updateError);
      // Don't fail the upload if project update fails
    }

    return NextResponse.json({
      success: true,
      file_url: publicUrl,
      file_type: file.type.includes('video') ? 'video' : 'image',
      file_name: fileName,
      project_id: projectId,
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}