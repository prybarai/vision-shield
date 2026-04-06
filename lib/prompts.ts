export function buildEstimationPrompt(params: {
  category: string; locationType: string; style: string; qualityTier: string; zipCode: string; notes?: string;
}) {
  return {
    system: 'You are a construction cost estimation expert. Generate rough planning estimates for home improvement projects. Always be transparent about assumptions. Never imply these are guaranteed quotes. Output ONLY valid JSON.',
    user: `Generate a rough cost estimate:
- Category: ${params.category}
- Location type: ${params.locationType}
- Style: ${params.style}
- Quality tier: ${params.qualityTier}
- ZIP: ${params.zipCode}
${params.notes ? `- Notes: ${params.notes}` : ''}

Output JSON:
{"low_estimate":number,"mid_estimate":number,"high_estimate":number,"assumptions":string[],"risk_notes":string[],"estimate_basis":string,"regional_notes":string}

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
