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
  return `Analyze this contractor quote/contract for red flags and missing terms:\n\n${rawText}\n\nOutput JSON: {"risk_score":number(0-100),"risk_level":"low"|"medium"|"high","red_flags":[{"flag":string,"explanation":string,"severity":"high"|"medium"|"low"}],"missing_terms":[{"term":string,"why_important":string}],"questions_to_ask":string[],"plain_english_summary":string,"payment_structure_analysis":string}`;
}

export function buildDisputePrompt(params: { situation: string; contractorInfo: Record<string, string>; amountPaid: number; state: string; whatHappened: string }) {
  return `Generate a dispute package for a homeowner:
- Situation: ${params.situation}
- Amount paid: $${params.amountPaid}
- State: ${params.state}
- What happened: ${params.whatHappened}
- Contractor: ${JSON.stringify(params.contractorInfo)}

Output JSON: {"letter_demand":string,"letter_ag_complaint":string,"letter_bbb":string,"letter_ftc":string,"documentation_checklist":string[]}
Make each document complete and ready to use.`;
}
