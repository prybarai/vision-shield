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
    : 'What this should cost';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width="58" height="52" viewBox="0 0 100 88" fill="none">
            <defs>
              <linearGradient id="logoGradient" x1="12" y1="78" x2="88" y2="10" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1f7cf7" />
                <stop offset="0.55" stopColor="#48c7f1" />
                <stop offset="1" stopColor="#a8eb57" />
              </linearGradient>
            </defs>
            <path d="M18 78V33.5L50 10L82 33.5V70" stroke="url(#logoGradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M34 78V48L66 71" stroke="url(#logoGradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '28px' }}>naili</span>
            <span style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '28px', marginLeft: '2px' }}>.ai</span>
          </div>
        </div>

        <div>
          <div style={{ color: '#93c5fd', fontSize: '22px', marginBottom: '16px', textTransform: 'capitalize' }}>
            {categoryLabel} project
          </div>
          <div style={{ color: 'white', fontSize: '52px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '20px' }}>
            Nail the vision. Know the cost.
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '24px', marginBottom: '28px' }}>
            Here&apos;s your naili plan
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

        <div style={{ color: '#64748b', fontSize: '18px' }}>naili.ai</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
