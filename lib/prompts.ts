import { type VisionAnalysis } from '@/lib/visionAnalysis';

function formatScopeAnswers(scopeAnswers?: Record<string, string>) {
  if (!scopeAnswers || Object.keys(scopeAnswers).length === 0) return 'none provided';
  return Object.entries(scopeAnswers)
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value.replace(/_/g, ' ')}`)
    .join(', ');
}

function formatAnalysisContext(analysis?: VisionAnalysis) {
  if (!analysis) return 'No photo analysis was available.';

  return [
    `space_type: ${analysis.space_type || 'unknown'}`,
    `estimated_sqft: ${analysis.estimated_sqft || 'unknown'}`,
    `current_materials: ${analysis.current_materials.join(', ') || 'none noted'}`,
    `current_condition: ${analysis.current_condition || 'unknown'}`,
    `architectural_features: ${analysis.architectural_features.join(', ') || 'none noted'}`,
    `existing_style: ${analysis.existing_style || 'unknown'}`,
    `renovation_scope: ${analysis.renovation_scope || 'unknown'}`,
    `key_challenges: ${analysis.key_challenges.join(', ') || 'none noted'}`,
    `photo_observations: ${analysis.photo_observations || 'none noted'}`,
    `customization_notes: ${analysis.customization_notes || 'none noted'}`,
    `visible_constraints: ${analysis.visible_constraints?.join(', ') || 'none noted'}`,
    `size_reasoning: ${analysis.size_reasoning.join(', ') || 'none noted'}`,
    `materials_signals: ${analysis.materials_signals.join(', ') || 'none noted'}`,
    `scope_signals: ${JSON.stringify(analysis.scope_signals)}`,
    `estimated_dimensions: ${JSON.stringify(analysis.estimated_dimensions)}`,
    `area_signals: ${JSON.stringify(analysis.area_signals)}`,
    `confidence: ${analysis.confidence || 'unknown'}`,
    `suggested_trade: ${analysis.suggested_trade || 'unknown'}`,
    `suggested_location_type: ${analysis.suggested_location_type || 'unknown'}`,
    `complexity: ${analysis.complexity || 'moderate'}`,
  ].join('\n- ');
}

export function buildEstimationPrompt(params: {
  category: string;
  locationType: string;
  style: string;
  qualityTier: string;
  zipCode: string;
  notes?: string;
  scopeAnswers?: Record<string, string>;
  analysis?: VisionAnalysis;
}) {
  return {
    system: 'You are a construction cost estimation expert. Generate a photo-aware planning estimate for a homeowner. Use the uploaded photo analysis and homeowner request as primary context, then layer in ZIP-based market assumptions. Never imply these are guaranteed quotes. Output ONLY valid JSON.',
    user: `Generate a planning-grade cost estimate for this home project.
- Category: ${params.category}
- Location type: ${params.locationType}
- Desired style: ${params.style}
- Quality tier: ${params.qualityTier}
- ZIP: ${params.zipCode}
- Homeowner notes: ${params.notes || 'none provided'}
- Scope answers: ${formatScopeAnswers(params.scopeAnswers)}
- Uploaded photo analysis:
- ${formatAnalysisContext(params.analysis)}

Requirements:
- The estimate must clearly reflect the visible condition, materials, and scope in the photo analysis.
- Use the homeowner request to explain what is changing, not just the category label.
- Give a regional note tied to the ZIP code.
- Include 4 to 7 specific assumptions and 2 to 4 risk notes.
- Include an estimate basis sentence that explicitly says the estimate used uploaded photo analysis.
- Include an optional labor/materials breakdown when you can infer one credibly.

Output JSON:
{"low_estimate":number,"mid_estimate":number,"high_estimate":number,"assumptions":string[],"risk_notes":string[],"estimate_basis":string,"regional_notes":string,"estimate_breakdown":{"labor_low":number,"labor_mid":number,"labor_high":number,"materials_low":number,"materials_mid":number,"materials_high":number}}

Benchmarks (mid, national avg): roofing $8k-$25k, exterior_paint $3k-$12k, deck_patio $5k-$35k, landscaping $3k-$20k, kitchen $15k-$75k, bathroom $8k-$35k, flooring $2k-$12k, interior_paint $1.5k-$8k.
Premium tier: 1.4-1.8x. Budget tier: 0.6-0.8x. High COL (CA,NY,MA,WA): 1.2-1.5x. Low COL (midwest,rural): 0.8-0.9x.`,
  };
}

export function buildMaterialsPrompt(params: { category: string; style: string; qualityTier: string; estimateMid: number }) {
  return `Generate a materials list for ${params.qualityTier}-tier ${params.category} (${params.style} style, ~$${params.estimateMid} budget).
Output JSON: {"line_items":[{"category":string,"item":string,"quantity":number,"unit":string,"finish_tier":string,"estimated_cost_low":number,"estimated_cost_high":number,"sourcing_notes":string}],"sourcing_notes":string}
Include 8+ items grouped by category.`;
}

export function buildBriefPrompt(params: { category: string; style: string; qualityTier: string; notes?: string; estimateLow: number; estimateHigh: number }) {
  return `Generate a contractor-ready project brief:
- Category: ${params.category}, Style: ${params.style}, Tier: ${params.qualityTier}
- Budget: $${params.estimateLow.toLocaleString()}–$${params.estimateHigh.toLocaleString()}
${params.notes ? `- Notes: ${params.notes}` : ''}
Output JSON: {"summary":string,"homeowner_goals":string,"contractor_notes":string,"site_verification_questions":string[]}
Include 5-7 site questions.`;
}

export function buildQuoteScanPrompt(rawText: string) {
  return `Review this contractor quote or contract for a homeowner. Stay calm, practical, and specific.

Document text:
${rawText}

Return ONLY valid JSON with this shape:
{
  "risk_score": number,
  "risk_level": "low" | "medium" | "high",
  "plain_english_summary": string,
  "payment_structure_analysis": string,
  "red_flags": [{"flag": string, "explanation": string, "severity": "high" | "medium" | "low"}],
  "missing_terms": [{"term": string, "why_important": string}],
  "questions_to_ask": string[]
}

Focus on payment structure, missing scope details, warranties, permits, schedule clarity, change-order process, insurance, lien waivers, and dispute terms.`;
}

export function buildDisputePrompt(params: { situation: string; contractorInfo: Record<string, string>; amountPaid: number; state: string; whatHappened: string }) {
  return `You are helping a homeowner organize a contractor dispute in a clear, factual, non-defamatory way.

Situation summary: ${params.situation}
Amount paid: $${params.amountPaid}
State: ${params.state}
What happened: ${params.whatHappened}
Contractor details: ${JSON.stringify(params.contractorInfo)}

Return ONLY valid JSON with this shape:
{
  "demand_letter": string,
  "ag_complaint": string,
  "bbb_complaint": string,
  "ftc_guidance": string,
  "documentation_checklist": string[],
  "small_claims_note": string
}

Requirements:
- Keep everything factual, professional, and homeowner-friendly.
- Do not invent laws or case citations.
- The demand letter should be ready to copy and personalize.
- The AG and BBB complaint drafts should be concise but useful.
- FTC guidance should explain appropriate reporting/documentation steps.
- The small_claims_note should explain when small claims might be worth considering and what to verify locally.`;
}
