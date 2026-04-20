import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrencyRange } from "@/lib/utils";

type ProjectRow = {
 id: string;
 project_category: string;
 created_at: string;
 uploaded_image_urls: string[] | null;
 generated_image_urls: string[] | null;
 notes?: string | null;
};

type EstimateRow = {
 project_id: string;
 low_estimate: number;
 high_estimate: number;
 created_at: string;
};

function toTitle(value: string) {
 return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function Showcase() {
 // Only fetch projects that have valid before/after images
 const { data: projectsData } = await supabaseAdmin
  .from("projects")
  .select("id, project_category, created_at, uploaded_image_urls, generated_image_urls, notes")
  .order("created_at", { ascending: false })
  .limit(6); // Fetch more to filter

 // Filter to only projects with valid before/after pairs
 const projects = ((projectsData || []) as ProjectRow[])
  .filter(project => {
   const hasBefore = project.uploaded_image_urls?.[0] && project.uploaded_image_urls[0].trim().length > 0;
   const hasAfter = project.generated_image_urls?.[0] && project.generated_image_urls[0].trim().length > 0;
   const imagesDifferent = project.uploaded_image_urls?.[0] !== project.generated_image_urls?.[0];
   return hasBefore && hasAfter && imagesDifferent;
  })
  .slice(0, 3); // Take top 3 valid projects

 const projectIds = projects.map((project) => project.id);

 const { data: estimatesData } = projectIds.length > 0
  ? await supabaseAdmin
    .from("estimates")
    .select("project_id, low_estimate, high_estimate, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
  : { data: [] as EstimateRow[] };

 const estimateByProject = new Map<string, EstimateRow>();
 (estimatesData as EstimateRow[] | null || []).forEach((estimate) => {
  if (!estimateByProject.has(estimate.project_id)) {
   estimateByProject.set(estimate.project_id, estimate);
  }
 });

 return (
  <section className="section relative border-y border-hairline bg-canvas-200/60">
   <div className="mx-auto max-w-7xl">
    <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
     <div className="max-w-2xl">
      <span className="mono-label">recent real projects</span>
      <h2 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
       Real projects with AI analysis
      </h2>
      <p className="mt-4 text-sm text-ink-600 md:text-base">
       Actual user projects where our AI analyzed photos and generated renovation plans with estimates.
      </p>
     </div>
     <Link href="/my-projects" className="btn-ghost self-start md:self-end">
      Open Vision Board
      <ArrowRight className="w-4 h-4" />
     </Link>
    </div>

    {projects.length === 0 ? (
     <div className="rounded-3xl border border-hairline bg-canvas-50 p-8 text-center text-ink-600 shadow-soft">
      No real projects yet. Start one above and it will appear here.
     </div>
    ) : (
     <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {projects.map((project) => {
       const estimate = estimateByProject.get(project.id);
       const beforeImage = project.uploaded_image_urls?.[0];
       const afterImage = project.generated_image_urls?.[0];

       return (
        <Link
         key={project.id}
         href={`/vision/results/${project.id}`}
         className="group relative overflow-hidden rounded-3xl border border-hairline bg-canvas-50 transition-all duration-500 hover:shadow-lift"
        >
         <div className="relative aspect-[4/3] overflow-hidden bg-graphite-700">
          {beforeImage ? (
           // eslint-disable-next-line @next/next/no-img-element
           <img
            src={beforeImage}
            alt={`${toTitle(project.project_category)} project`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
           />
          ) : (
           <div className="absolute inset-0 flex items-center justify-center text-sm text-canvas-50/70">No image yet</div>
          )}

          {afterImage && beforeImage && afterImage !== beforeImage && (
           <div
            className="absolute inset-0 transition-all duration-700 group-hover:[clip-path:inset(0_0_0_0%)]"
            style={{ clipPath: "inset(0 0 0 50%)" }}
           >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
             src={afterImage}
             alt={`${toTitle(project.project_category)} concept`}
             className="absolute inset-0 h-full w-full object-cover"
            />
           </div>
          )}

          <div className="absolute left-3 top-3 rounded-full bg-graphite-700/75 px-2 py-0.5 backdrop-blur">
           <span className="mono-label !text-canvas-50">{toTitle(project.project_category)}</span>
          </div>
          {afterImage && beforeImage && afterImage !== beforeImage && (
           <div className="absolute right-3 top-3 rounded-full bg-sand/90 px-2 py-0.5 backdrop-blur">
            <span className="mono-label !text-ink">concept ready</span>
           </div>
          )}
         </div>

         <div className="p-5">
          <div className="flex items-end justify-between gap-3">
           <h3 className="font-display text-2xl tracking-tight text-ink">{toTitle(project.project_category)}</h3>
           <span className="mono-label">{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-ink-600">
           {project.notes?.trim() || "Open this real project to review the live estimate, concept, and brief."}
          </p>
          <div className="mt-4 border-t border-hairline pt-4">
           <span className="mono-label">estimate</span>
           <div className="mt-1 font-display text-lg text-ink">
            {estimate ? formatCurrencyRange(estimate.low_estimate, estimate.high_estimate) : "Generating"}
           </div>
          </div>
        </div>
       </Link>
       );
      })}
     </div>
    )}
   </div>
  </section>
 );
}
