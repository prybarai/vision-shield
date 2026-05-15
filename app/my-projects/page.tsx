import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
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
 description: "Your saved home projects with AI-powered estimates, concepts, and contractor briefs.",
};

function toTitle(value: string) {
 return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function friendlyCategory(raw: string) {
 const map: Record<string, string> = {
  custom_project: "Home Project",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  roofing: "Roofing",
  deck_patio: "Deck & Patio",
  landscaping: "Landscaping",
  exterior_paint: "Exterior Paint",
  flooring: "Flooring",
  general_repair: "General Repair",
 };
 return map[raw] || toTitle(raw);
}

function friendlyStatus(raw: string) {
 const map: Record<string, string> = {
  draft: "In Progress",
  processing: "Analyzing",
  complete: "Plan Ready",
  completed: "Plan Ready",
  failed: "Needs Review",
 };
 return map[raw] || toTitle(raw);
}

function statusColor(raw: string) {
 switch (raw) {
  case "complete":
  case "completed":
   return "text-mint";
  case "processing":
   return "text-sand-dark";
  case "failed":
   return "text-red-500";
  default:
   return "text-ink-500";
 }
}

export default async function MyProjectsPage() {
 const { data: projectsData } = await supabaseAdmin
  .from("projects")
  .select(
   "id, project_category, zip_code, quality_tier, status, created_at, uploaded_image_urls, generated_image_urls, notes"
  )
  .order("created_at", { ascending: false })
  .limit(24);

 const projects = (projectsData || []) as ProjectRow[];
 const projectIds = projects.map((project) => project.id);

 const { data: estimatesData } =
  projectIds.length > 0
   ? await supabaseAdmin
     .from("estimates")
     .select("project_id, low_estimate, high_estimate, created_at")
     .in("project_id", projectIds)
     .order("created_at", { ascending: false })
   : { data: [] as EstimateRow[] };

 const estimateByProject = new Map<string, EstimateRow>();
 ((estimatesData as EstimateRow[] | null) || []).forEach((estimate) => {
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
      <span className="mono-label">your projects</span>
     </div>
     <h1 className="max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">
      Your home{" "}
      <span className="italic bg-gradient-to-r from-sand-dark to-sand bg-clip-text text-transparent">
       vision board.
      </span>
     </h1>
     <p className="mt-5 max-w-2xl text-lg text-ink-600">
      Every project you start lives here. Open any card to review your AI
      estimate, design concepts, and contractor brief.
     </p>
    </div>
   </section>

   <section className="section relative pt-4">
    <div className="mx-auto max-w-7xl">
     <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <span className="mono-label">
       {projects.length} project{projects.length !== 1 ? "s" : ""}
      </span>
      <Link href="/#upload" className="btn-primary">
       Start a new project
      </Link>
     </div>

     {projects.length === 0 ? (
      <div className="rounded-3xl border border-hairline bg-canvas-50/70 p-12 text-center shadow-soft">
       <Sparkles className="mx-auto h-8 w-8 text-sand-dark mb-4" />
       <h2 className="font-display text-3xl tracking-tight text-ink">
        No projects yet.
       </h2>
       <p className="mt-3 text-ink-600">
        Upload a photo of any space and Naili will create a complete project
        plan you can revisit here anytime.
       </p>
       <Link href="/#upload" className="btn-primary mt-6 inline-flex">
        Start your first project
       </Link>
      </div>
     ) : (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
       {projects.map((project) => {
        const estimate = estimateByProject.get(project.id);
        const previewImage =
         project.generated_image_urls?.[0] ||
         project.uploaded_image_urls?.[0] ||
         null;
        const category = friendlyCategory(project.project_category);

        return (
         <Link
          key={project.id}
          href={`/vision/results/${project.id}`}
          className="group overflow-hidden rounded-3xl border border-hairline bg-canvas-50 transition-all duration-300 hover:-translate-y-1 hover:border-panel hover:shadow-lift"
         >
          <div className="relative aspect-[4/3] bg-graphite-700">
           {previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
             src={previewImage}
             alt={category}
             className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
           ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-canvas-50/70">
             <Sparkles className="h-6 w-6 text-canvas-50/40" />
             <span className="text-sm">Processing...</span>
            </div>
           )}
           <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-graphite-700/75 px-2.5 py-1 backdrop-blur">
            <span className="mono-label !text-canvas-50">{category}</span>
           </div>
           <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/85 px-2.5 py-1">
            <span className="mono-label !text-ink">
             {toTitle(project.quality_tier)}
            </span>
           </div>
          </div>

          <div className="p-5">
           <div className="flex items-center justify-between">
            <span className="mono-label">ZIP {project.zip_code}</span>
            <span className="mono-label">
             {new Date(project.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
             })}
            </span>
           </div>

           <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">
            {category}
           </h2>
           <p className="mt-2 line-clamp-2 text-sm text-ink-600">
            {project.notes?.trim() ||
             "Open to review your estimate, concepts, and contractor brief."}
           </p>

           <div className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
            <div>
             <span className="mono-label">estimate</span>
             <div className="mt-1 font-display text-lg text-ink">
              {estimate
               ? formatCurrencyRange(
                 estimate.low_estimate,
                 estimate.high_estimate
                )
               : "Preparing..."}
             </div>
            </div>
            <div>
             <span className="mono-label">status</span>
             <div
              className={`mt-1 font-display text-lg ${statusColor(
               project.status
              )}`}
             >
              {friendlyStatus(project.status)}
             </div>
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
