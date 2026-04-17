import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import VisionResultsView from '@/components/vision/VisionResultsView';
import type { Estimate, MaterialList, Project, ProjectBrief } from '@/types';

interface PageProps {
  params: Promise<{ project_id: string }>;
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.toLowerCase() !== 'null' && item.toLowerCase() !== 'undefined');
}

export async function generateMetadata({ params }: PageProps) {
  const { project_id } = await params;
  return {
    title: 'Here’s your naili plan',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      images: [`/api/og/vision/${project_id}`],
    },
  };
}

export default async function VisionResultsPage({ params }: PageProps) {
  const { project_id } = await params;

  const [projectRes, estimateRes, materialsRes, briefRes] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', project_id).single(),
    supabaseAdmin.from('estimates').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('material_lists').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('project_briefs').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  if (!projectRes.data) notFound();

  const project = projectRes.data as Project;
  const estimate = estimateRes.data as Estimate | null;
  const materials = materialsRes.data as MaterialList | null;
  const brief = briefRes.data as ProjectBrief | null;
  const categoryLabel = project.project_category === 'custom_project' ? 'Custom Project' : toTitleCase(project.project_category);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${project.share_token}`;
  const estimateAssumptions = cleanList(estimate?.assumptions);
  const riskNotes = cleanList(estimate?.risk_notes);
  const likelyTrades = cleanList((brief as ProjectBrief & { likely_trades?: string[] } | null)?.likely_trades);
  const siteQuestions = cleanList(brief?.site_verification_questions);

  return (
    <VisionResultsView
      projectId={project_id}
      project={project}
      estimate={estimate}
      materials={materials}
      brief={brief}
      categoryLabel={categoryLabel}
      shareUrl={shareUrl}
      estimateAssumptions={estimateAssumptions}
      riskNotes={riskNotes}
      likelyTrades={likelyTrades}
      siteQuestions={siteQuestions}
    />
  );
}
