import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

const schema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().nullable().optional(),
  zip_code: z.string().min(5, "Valid ZIP code is required"),
  preferred_timing: z
    .enum(["asap", "within_month", "planning_ahead"])
    .default("within_month"),
  priority: z.enum(["budget", "speed", "quality"]).default("quality"),
  project_type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  estimate_mid: z.number().nullable().optional(),
  source: z.string().default("naili_get_quotes"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    /* ── If project_id is provided, enrich the lead with project data ── */
    let enrichment: Record<string, unknown> = {};
    if (parsed.project_id) {
      try {
        const { data: project } = await supabaseAdmin
          .from("projects")
          .select("*")
          .eq("id", parsed.project_id)
          .single();

        if (project) {
          // Get estimate data (non-blocking — ok if missing)
          const { data: estimate } = await supabaseAdmin
            .from("estimates")
            .select("*")
            .eq("project_id", parsed.project_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get brief data (non-blocking — ok if missing)
          const { data: brief } = await supabaseAdmin
            .from("project_briefs")
            .select("*")
            .eq("project_id", parsed.project_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          enrichment = {
            project_type:
              project.project_category || parsed.project_type || null,
            scope_summary: project.notes || null,
            photo_urls: project.uploaded_image_urls || [],
            estimate_low: estimate?.low_estimate || null,
            estimate_mid:
              estimate?.mid_estimate || parsed.estimate_mid || null,
            estimate_high: estimate?.high_estimate || null,
            brief_summary: brief?.summary || null,
          };

          // Update project status (non-blocking — ok if fails)
          await supabaseAdmin
            .from("projects")
            .update({
              status: "lead_submitted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", parsed.project_id)
            .then(() => {});
        }
      } catch {
        // Project enrichment failed — continue without it
        console.warn("Project enrichment failed, continuing without it");
      }
    }

    /* ── Determine budget range from estimate ── */
    const estMid =
      (enrichment.estimate_mid as number) || parsed.estimate_mid || 0;
    let budget_range = "15k_50k";
    if (estMid > 0) {
      if (estMid < 5000) budget_range = "under_5k";
      else if (estMid < 15000) budget_range = "5k_15k";
      else if (estMid < 50000) budget_range = "15k_50k";
      else budget_range = "50k_plus";
    }

    /* ── Build the lead record ── */
    const leadCore = {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      email: parsed.email,
      phone: parsed.phone,
      zip_code: parsed.zip_code,
      preferred_timing: parsed.preferred_timing,
      budget_range,
      priority: parsed.priority,
      status: "new",
      source: parsed.source,
      notes: parsed.notes || null,
      address: parsed.address || null,
      project_id: parsed.project_id || null,
      project_type: (enrichment.project_type as string) || parsed.project_type || null,
    };

    /* ── Try inserting with full enrichment first ── */
    let insertData: Record<string, unknown> = {
      ...leadCore,
      scope_summary: enrichment.scope_summary || null,
      photo_urls: enrichment.photo_urls || [],
      estimate_low: enrichment.estimate_low || null,
      estimate_mid: enrichment.estimate_mid || parsed.estimate_mid || null,
      estimate_high: enrichment.estimate_high || null,
      brief_summary: enrichment.brief_summary || null,
    };

    let { data, error } = await supabaseAdmin
      .from("leads")
      .insert(insertData)
      .select()
      .single();

    /* ── If full insert fails (e.g. missing columns), try core-only ── */
    if (error) {
      console.warn("Full lead insert failed, trying core-only:", error.message);

      const { data: coreData, error: coreError } = await supabaseAdmin
        .from("leads")
        .insert(leadCore)
        .select()
        .single();

      if (coreError) {
        console.error("Lead insert error (core):", coreError);
        return NextResponse.json(
          {
            error:
              "We couldn't save your request right now. Please try again in a moment.",
            detail: coreError.message,
          },
          { status: 500 }
        );
      }
      data = coreData;
    }

    return NextResponse.json({ lead: data, success: true });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.issues || [];
      return NextResponse.json(
        { error: issues[0]?.message || "Please check your information and try again." },
        { status: 400 }
      );
    }
    console.error("Lead creation error:", err);
    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
