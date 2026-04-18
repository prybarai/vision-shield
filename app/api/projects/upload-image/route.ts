import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('project_id') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or WEBP.' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const filename = `uploads/${uuidv4()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('project-images')
      .upload(filename, bytes, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from('project-images')
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Update project with uploaded image URL
    if (projectId) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('uploaded_image_urls')
        .eq('id', projectId)
        .single();

      const existing = project?.uploaded_image_urls || [];
      await supabaseAdmin
        .from('projects')
        .update({ uploaded_image_urls: [...existing, publicUrl] })
        .eq('id', projectId);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('upload-image error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
