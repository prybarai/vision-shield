import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrencyRange } from "@/lib/utils";

type ProjectRow = {
 id: string;
 project_category: string;
 zip_code: string;
 quality_tier: string;
 status: string;
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 title: "Vision Board — Naili",
 description: "Real Naili projects, concepts, and planning results.",
};

function toTitle(value: string) {
 return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function MyProjectsPage() {
 const { data: projectsData } = await supabaseAdmin
  .from("projects")
  .select("id, project_category, zip_code, quality_tier, status, created_at, uploaded_image_urls, generated_image_urls, notes")
  .order("created_at", { ascending: false })
  .limit(24);

 const projects = (projectsData || []) as ProjectRow[];
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
  <main className="relative z-10 min-h-screen bg-canvas">
   <Nav />
   <section className="px-6 pb-12 pt-32 md:px-10 md:pt-40">
    <div className="mx-auto max-w-7xl">
     <div className="mb-4 flex items-center gap-2.5">
      <div className="ai-pulse" />
      <span className="mono-label">your real projects</span>
     </div>
     <h1 className="max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">
      Your evolving <span className="italic text-signature">home roadmap.</span>
     </h1>
     <p className="mt-5 max-w-2xl text-lg text-ink-600">
      These cards are pulled from the real Naili project pipeline, not local demo state. Open any project to review the live estimate, concept, and contractor brief.
     </p>
    </div>
   </section>

   <section className="section pt-4 relative">
    <div className="mx-auto max-w-7xl">
     <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <span className="mono-label">{projects.length} real projects found</span>
      <Link href="/#upload" className="btn-primary">
       Start a new real project
      </Link>
     </div>

     {projects.length === 0 ? (
      <div className="rounded-3xl border border-hairline bg-canvas-50/70 p-12 text-center shadow-soft">
       <h2 className="font-display text-3xl tracking-tight text-ink">No saved projects yet.</h2>
       <p className="mt-3 text-ink-600">Upload a photo and Naili will create a real project record with results you can revisit here.</p>
       <Link href="/#upload" className="btn-primary mt-6 inline-flex">Start your first project</Link>
      </div>
     ) : (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
       {projects.map((project) => {
        const estimate = estimateByProject.get(project.id);
        const previewImage = project.generated_image_urls?.[0] || project.uploaded_image_urls?.[0] || null;

        return (
         <Link
          key={project.id}
          href={`/vision/results/${project.id}`}
          className="group overflow-hidden rounded-3xl border border-hairline bg-canvas-50 transition-all duration-300 hover:-translate-y-1 hover:border-panel hover:shadow-lift"
         >
          <div className="relative aspect-[4/3] bg-graphite-700">
           {previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage} alt={toTitle(project.project_category)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
           ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-canvas-50/70">No image yet</div>
           )}
           <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-graphite-700/75 px-2.5 py-1 backdrop-blur">
            <span className="mono-label !text-canvas-50">{toTitle(project.project_category)}</span>
           </div>
           <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/85 px-2.5 py-1">
            <span className="mono-label !text-ink">{project.quality_tier}</span>
           </div>
          </div>

          <div className="p-5">
           <div className="flex items-center justify-between">
            <span className="mono-label">ZIP {project.zip_code}</span>
            <span className="mono-label">{new Date(project.created_at).toLocaleDateString()}</span>
           </div>

           <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">{toTitle(project.project_category)}</h2>
           <p className="mt-2 line-clamp-2 text-sm text-ink-600">
            {project.notes?.trim() || "Open this project to review the live scope, estimate, and results."}
           </p>

           <div className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
            <div>
             <span className="mono-label">estimate</span>
             <div className="mt-1 font-display text-lg text-ink">
              {estimate ? formatCurrencyRange(estimate.low_estimate, estimate.high_estimate) : "Generating"}
             </div>
            </div>
            <div>
             <span className="mono-label">status</span>
             <div className="mt-1 font-display text-lg text-ink">{toTitle(project.status)}</div>
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
   <Footer />
  </main>
 );
}
