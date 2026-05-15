import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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
 return (
  map[raw] ||
  raw.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
 );
}

export default async function Showcase() {
 const { data: projectsData } = await supabaseAdmin
  .from("projects")
  .select(
   "id, project_category, created_at, uploaded_image_urls, generated_image_urls, notes"
  )
  .order("created_at", { ascending: false })
  .limit(6);

 const projects = ((projectsData || []) as ProjectRow[])
  .filter((project) => {
   const hasBefore =
    project.uploaded_image_urls?.[0] &&
    project.uploaded_image_urls[0].trim().length > 0;
   const hasAfter =
    project.generated_image_urls?.[0] &&
    project.generated_image_urls[0].trim().length > 0;
   const imagesDifferent =
    project.uploaded_image_urls?.[0] !== project.generated_image_urls?.[0];
   return hasBefore && hasAfter && imagesDifferent;
  })
  .slice(0, 3);

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
  <section className="section relative border-y border-hairline bg-canvas-200/60">
   <div className="mx-auto max-w-7xl">
    <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
     <div className="max-w-2xl">
      <span className="mono-label">recent projects</span>
      <h2 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
       See what Naili can do
      </h2>
      <p className="mt-4 text-sm text-ink-600 md:text-base">
       Real projects where our AI analyzed photos and generated renovation
       plans with cost estimates and design concepts.
      </p>
     </div>
     <Link href="/my-projects" className="btn-ghost self-start md:self-end">
      Open Vision Board
      <ArrowRight className="h-4 w-4" />
     </Link>
    </div>

    {projects.length === 0 ? (
     <div className="rounded-3xl border border-hairline bg-canvas-50 p-12 text-center shadow-soft">
      <Sparkles className="mx-auto mb-4 h-8 w-8 text-sand-dark" />
      <h3 className="font-display text-2xl tracking-tight text-ink">
       Projects coming soon
      </h3>
      <p className="mt-3 text-ink-600">
       Upload a photo above to be one of the first to see AI-powered
       renovation planning in action.
      </p>
     </div>
    ) : (
     <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {projects.map((project) => {
       const estimate = estimateByProject.get(project.id);
       const beforeImage = project.uploaded_image_urls?.[0];
       const afterImage = project.generated_image_urls?.[0];
       const category = friendlyCategory(project.project_category);

       return (
        <Link
         key={project.id}
         href={`/vision/results/${project.id}`}
         className="group relative overflow-hidden rounded-3xl border border-hairline bg-canvas-50 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
        >
         <div className="relative aspect-[4/3] overflow-hidden bg-graphite-700">
          {beforeImage ? (
           // eslint-disable-next-line @next/next/no-img-element
           <img
            src={beforeImage}
            alt={`${category} project`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
           />
          ) : (
           <div className="absolute inset-0 flex items-center justify-center text-sm text-canvas-50/70">
            Processing...
           </div>
          )}

          {afterImage &&
           beforeImage &&
           afterImage !== beforeImage && (
            <div
             className="absolute inset-0 transition-all duration-700 group-hover:[clip-path:inset(0_0_0_0%)]"
             style={{ clipPath: "inset(0 0 0 50%)" }}
            >
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img
              src={afterImage}
              alt={`${category} concept`}
              className="absolute inset-0 h-full w-full object-cover"
             />
            </div>
           )}

          <div className="absolute left-3 top-3 rounded-full bg-graphite-700/75 px-2.5 py-1 backdrop-blur">
           <span className="mono-label !text-canvas-50">{category}</span>
          </div>
          {afterImage &&
           beforeImage &&
           afterImage !== beforeImage && (
            <div className="absolute right-3 top-3 rounded-full bg-sand/90 px-2.5 py-1 backdrop-blur">
             <span className="mono-label !text-ink">Concept ready</span>
            </div>
           )}
         </div>

         <div className="p-5">
          <div className="flex items-end justify-between gap-3">
           <h3 className="font-display text-2xl tracking-tight text-ink">
            {category}
           </h3>
           <span className="mono-label">
            {new Date(project.created_at).toLocaleDateString("en-US", {
             month: "short",
             day: "numeric",
            })}
           </span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-ink-600">
           {project.notes?.trim() ||
            "Open to explore the full estimate, design concepts, and contractor brief."}
          </p>
          <div className="mt-4 border-t border-hairline pt-4">
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
