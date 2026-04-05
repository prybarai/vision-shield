import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;

  const [projectRes, estimateRes] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', project_id).single(),
    supabaseAdmin.from('estimates').select('*').eq('project_id', project_id).limit(1).single(),
  ]);

  const project = projectRes.data;
  const estimate = estimateRes.data;

  const categoryLabel = project?.project_category?.replace(/_/g, ' ') || 'Home Project';
  const estimateText = estimate
    ? `$${estimate.low_estimate.toLocaleString()} – $${estimate.high_estimate.toLocaleString()}`
    : 'Get your estimate';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '60px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              background: '#2563eb',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>P</span>
          </div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '28px' }}>Prybar</span>
        </div>

        <div>
          <div style={{ color: '#93c5fd', fontSize: '22px', marginBottom: '16px', textTransform: 'capitalize' }}>
            {categoryLabel} Project
          </div>
          <div style={{ color: 'white', fontSize: '52px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '24px' }}>
            See what it could look like
          </div>
          <div
            style={{
              background: '#2563eb',
              borderRadius: '16px',
              padding: '16px 32px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>{estimateText}</span>
          </div>
        </div>

        <div style={{ color: '#64748b', fontSize: '18px' }}>
          prybar.com · AI-powered home improvement planning
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
