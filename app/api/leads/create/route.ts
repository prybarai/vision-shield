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
  preferred_timing: z.enum(["asap", "within_month", "planning_ahead"]).default("within_month"),
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
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("id", parsed.project_id)
        .single();

      if (project) {
        // Get estimate data
        const { data: estimate } = await supabaseAdmin
          .from("estimates")
          .select("*")
          .eq("project_id", parsed.project_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get brief data
        const { data: brief } = await supabaseAdmin
          .from("project_briefs")
          .select("*")
          .eq("project_id", parsed.project_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        enrichment = {
          project_type: project.project_category || parsed.project_type,
          scope_summary: project.notes || null,
          photo_urls: project.uploaded_image_urls || [],
          estimate_low: estimate?.low_estimate || null,
          estimate_mid: estimate?.mid_estimate || parsed.estimate_mid || null,
          estimate_high: estimate?.high_estimate || null,
          brief_summary: brief?.summary || null,
        };

        // Update project status to lead_submitted
        await supabaseAdmin
          .from("projects")
          .update({ status: "lead_submitted", updated_at: new Date().toISOString() })
          .eq("id", parsed.project_id);
      }
    }

    /* ── Determine budget range from estimate ── */
    const estMid = (enrichment.estimate_mid as number) || parsed.estimate_mid || 0;
    let budget_range: string = "15k_50k";
    if (estMid > 0) {
      if (estMid < 5000) budget_range = "under_5k";
      else if (estMid < 15000) budget_range = "5k_15k";
      else if (estMid < 50000) budget_range = "15k_50k";
      else budget_range = "50k_plus";
    }

    /* ── Insert the lead ── */
    const leadData = {
      project_id: parsed.project_id || null,
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
      ...enrichment,
    };

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json(
        { error: "Failed to submit your request. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead: data, success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const issues = err.issues || [];
      return NextResponse.json(
        { error: issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Lead creation error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
