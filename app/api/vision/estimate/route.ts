import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildEstimationPrompt } from '@/lib/prompts';
import { getEstimatorFloor, getScopeMids } from '@/lib/pricing';
import { buildAnalysisSummary, describeAnalysisFacts, FALLBACK_VISION_ANALYSIS, type VisionAnalysis } from '@/lib/visionAnalysis';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  location_type: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  zip_code: z.string(),
  notes: z.string().optional(),
  scope_answers: z.record(z.string(), z.string()).optional(),
  analysis: z.unknown().optional(),
});

interface EstimateBreakdown {
  labor_low: number;
  labor_mid: number;
  labor_high: number;
  materials_low: number;
  materials_mid: number;
  materials_high: number;
}

interface EstimateResult {
  low_estimate: number;
  mid_estimate: number;
  high_estimate: number;
  assumptions: string[];
  risk_notes: string[];
  estimate_basis: string;
  regional_notes?: string;
  estimate_breakdown?: EstimateBreakdown;
}

type ScopeAnswers = Record<string, string>;
type QualityTier = 'budget' | 'mid' | 'premium';
type SizeKey = 'small' | 'medium' | 'large';

type AreaBucket = 'low' | 'medium' | 'high' | null | undefined;
type WidthBucket = 'narrow' | 'standard' | 'wide' | null | undefined;
type DepthBucket = 'shallow' | 'standard' | 'deep' | null | undefined;

const GUIDE_ESTIMATE_GUARDRAILS: Partial<Record<string, { low: number; mid: number; high: number }>> = {
  bathroom: getEstimatorFloor('bathroom'),
  kitchen: getEstimatorFloor('kitchen'),
  deck_patio: getEstimatorFloor('deck_patio'),
  roofing: getEstimatorFloor('roofing'),
  interior_paint: getEstimatorFloor('interior_paint'),
};

function roundToHundred(value: number) {
  return Math.round(value / 100) * 100;
}

function buildRange(mid: number, spread = 0.15) {
  const low = roundToHundred(mid * (1 - spread));
  const roundedMid = roundToHundred(mid);
  const high = roundToHundred(mid * (1 + spread));

  return {
    low_estimate: Math.max(low, 100),
    mid_estimate: Math.max(roundedMid, 100),
    high_estimate: Math.max(high, 100),
  };
}

function applyEstimateGuardrails(category: string, result: EstimateResult): EstimateResult {
  const floor = GUIDE_ESTIMATE_GUARDRAILS[category];
  if (!floor || result.low_estimate >= floor.low) return result;

  return {
    ...result,
    low_estimate: Math.max(result.low_estimate, floor.low),
    mid_estimate: Math.max(result.mid_estimate, floor.mid),
    high_estimate: Math.max(result.high_estimate, floor.high),
    assumptions: [
      ...result.assumptions,
      'Guide-aligned planning floor applied to avoid unrealistically low outputs for this project type.',
    ],
  };
}

function getZipMultiplier(zip: string): number {
  const firstDigit = zip.trim()[0];

  if (firstDigit === '9' || firstDigit === '0') return 1.2;
  if (firstDigit === '1') return 1.08;
  if (firstDigit === '6' || firstDigit === '7') return 0.95;
  return 1.0;
}

function getRegionalNotes(zip: string, multiplier: number) {
  if (multiplier > 1) {
    return `ZIP ${zip} uses an above-average labor and material multiplier of ${multiplier.toFixed(2)}.`;
  }

  if (multiplier < 1) {
    return `ZIP ${zip} uses a slightly below-average labor and material multiplier of ${multiplier.toFixed(2)}.`;
  }

  return `ZIP ${zip} uses a baseline regional multiplier of ${multiplier.toFixed(2)}.`;
}

function getQualityMultiplier(qualityTier: string) {
  const multipliers: Record<string, number> = {
    budget: 0.85,
    mid: 1.0,
    premium: 1.35,
  };

  return multipliers[qualityTier] ?? 1.0;
}

function areaBucketMultiplier(bucket: AreaBucket, low = 0.85, high = 1.15) {
  if (bucket === 'low') return low;
  if (bucket === 'high') return high;
  return 1;
}

function widthBucketMultiplier(bucket: WidthBucket, narrow = 0.94, wide = 1.1) {
  if (bucket === 'narrow') return narrow;
  if (bucket === 'wide') return wide;
  return 1;
}

function depthBucketMultiplier(bucket: DepthBucket, shallow = 0.95, deep = 1.1) {
  if (bucket === 'shallow') return shallow;
  if (bucket === 'deep') return deep;
  return 1;
}

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;

  const partial = input as Partial<VisionAnalysis>;
  return {
    ...FALLBACK_VISION_ANALYSIS,
    ...partial,
    visible_features: Array.isArray(partial.visible_features) ? partial.visible_features : [],
    size_reasoning: Array.isArray(partial.size_reasoning) ? partial.size_reasoning : [],
    estimation_notes: Array.isArray(partial.estimation_notes) ? partial.estimation_notes : [],
    materials_signals: Array.isArray(partial.materials_signals) ? partial.materials_signals : [],
    scope_signals: {
      ...FALLBACK_VISION_ANALYSIS.scope_signals,
      ...(partial.scope_signals || {}),
    },
    estimated_dimensions: {
      ...FALLBACK_VISION_ANALYSIS.estimated_dimensions,
      ...(partial.estimated_dimensions || {}),
    },
    area_signals: {
      ...FALLBACK_VISION_ANALYSIS.area_signals,
      ...(partial.area_signals || {}),
    },
  };
}

function withAnalysisBasis(defaultBasis: string, analysis?: VisionAnalysis, maxFacts = 3) {
  const facts = describeAnalysisFacts(analysis).slice(0, maxFacts);
  if (facts.length === 0) return defaultBasis;
  return `Scope-based planning estimate using uploaded photo analysis (${facts.join(', ')}), project category assumptions, and ZIP-based labor adjustment.`;
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function humanize(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ') : 'unknown';
}

function resolveSizeConflict(userSize: string | undefined, analysisSize: string | undefined, label: string, assumptions: string[]) {
  if (userSize && analysisSize && userSize !== analysisSize) {
    assumptions.push(`Using homeowner-selected ${label} size of ${humanize(userSize)} even though photo analysis suggested ${humanize(analysisSize)}`);
  }
}

function getPreferredSize(scopeAnswers: ScopeAnswers, analysis: VisionAnalysis | undefined, key: string, fallback: SizeKey = 'medium') {
  const userSize = scopeAnswers[key] as SizeKey | undefined;
  const analysisSize = (analysis?.scope_signals.room_size || analysis?.estimated_size_bucket) as SizeKey | undefined;
  return {
    chosen: userSize || analysisSize || fallback,
    userSize,
    analysisSize,
  };
}

function inferredRoomSize(scopeAnswers: ScopeAnswers, analysis?: VisionAnalysis) {
  const { chosen, userSize, analysisSize } = getPreferredSize(scopeAnswers, analysis, 'room_size', 'medium');
  if (chosen === 'small') return { key: 'small' as const, floorArea: 100, wallArea: 260, userSize, analysisSize };
  if (chosen === 'large') return { key: 'large' as const, floorArea: 260, wallArea: 620, userSize, analysisSize };
  return { key: 'medium' as const, floorArea: 170, wallArea: 420, userSize, analysisSize };
}

function getPaintOpeningAdjustments(visibleWindows?: number | null) {
  const count = visibleWindows ?? 0;
  if (count >= 6) {
    return {
      count,
      reductionFactor: 0.82,
      trimLaborFactor: 1.12,
      summary: `Visible openings appear heavy (${count} windows), so wall area was reduced more while trim and masking labor stayed elevated`,
    };
  }
  if (count >= 3) {
    return {
      count,
      reductionFactor: 0.9,
      trimLaborFactor: 1.06,
      summary: `Visible openings appear moderate (${count} windows), so wall area was reduced modestly with a small trim/masking labor add-back`,
    };
  }
  return {
    count,
    reductionFactor: 0.97,
    trimLaborFactor: 1,
    summary: count > 0
      ? `Visible window count (${count}) caused only a light opening deduction`
      : 'No meaningful opening deduction beyond a standard door and trim allowance',
  };
}

function buildEstimateBreakdown(range: { low_estimate: number; mid_estimate: number; high_estimate: number }, laborShare: number): EstimateBreakdown {
  const clamp = (value: number) => Math.min(0.9, Math.max(0.35, value));
  const share = clamp(laborShare);
  const laborLow = roundToHundred(range.low_estimate * share);
  const laborMid = roundToHundred(range.mid_estimate * share);
  const laborHigh = roundToHundred(range.high_estimate * share);

  return {
    labor_low: laborLow,
    labor_mid: laborMid,
    labor_high: laborHigh,
    materials_low: Math.max(range.low_estimate - laborLow, 0),
    materials_mid: Math.max(range.mid_estimate - laborMid, 0),
    materials_high: Math.max(range.high_estimate - laborHigh, 0),
  };
}

function addConfidenceAssumption(assumptions: string[], analysis?: VisionAnalysis) {
  if (!analysis?.confidence) return;
  if (analysis.confidence === 'low') {
    assumptions.push('Photo visibility confidence was low, so size and scope assumptions were kept broader than usual');
  } else if (analysis.confidence === 'high') {
    assumptions.push('Photo visibility confidence was high, so visible size and complexity assumptions could be grounded more tightly');
  } else {
    assumptions.push('Photo visibility confidence was moderate, so visible scope signals were used with standard planning caution');
  }
}

function addPhotoDrivenAssumptions(assumptions: string[], analysis?: VisionAnalysis, category?: string) {
  if (!analysis) return;

  if (analysis.space_type) {
    assumptions.push(`Uploaded photo reads as a ${analysis.space_type.replace(/_/g, ' ')}`);
  }

  if (analysis.estimated_sqft) {
    assumptions.push(`Visible project size was planned around ${analysis.estimated_sqft}`);
  }

  if (analysis.current_condition && analysis.current_condition !== 'unknown') {
    assumptions.push(`Current visible condition appears ${analysis.current_condition}`);
  }

  if (analysis.current_materials.length > 0) {
    assumptions.push(`Visible materials include ${analysis.current_materials.slice(0, 3).join(', ')}`);
  }

  if (analysis.renovation_scope) {
    assumptions.push(`Homeowner goal interpreted as: ${analysis.renovation_scope}`);
  }

  if ((category === 'exterior_paint' || category === 'roofing') && analysis.scope_signals.stories) {
    const windowText = typeof analysis.scope_signals.window_count_visible === 'number'
      ? ` with ${analysis.scope_signals.window_count_visible} visible windows`
      : '';
    assumptions.push(`Photo appears to show a ${analysis.scope_signals.stories}-story exterior${windowText}`);
  }

  if (category === 'interior_paint' && analysis.scope_signals.room_size) {
    const windowText = typeof analysis.scope_signals.window_count_visible === 'number' && analysis.scope_signals.window_count_visible > 0
      ? ` with ${analysis.scope_signals.window_count_visible} visible window openings`
      : '';
    assumptions.push(`Room appears ${analysis.scope_signals.room_size}${windowText}`);
  }

  if (category === 'roofing' && analysis.scope_signals.roof_complexity) {
    assumptions.push(`Roof complexity appears ${analysis.scope_signals.roof_complexity} from uploaded image`);
  }

  if (analysis.estimated_dimensions.width_bucket) {
    assumptions.push(`Visible width reads as ${humanize(analysis.estimated_dimensions.width_bucket)}`);
  }

  if (analysis.estimated_dimensions.depth_bucket) {
    assumptions.push(`Visible depth reads as ${humanize(analysis.estimated_dimensions.depth_bucket)}`);
  }

  if (analysis.size_reasoning.length > 0) {
    assumptions.push(`Visible size cues: ${analysis.size_reasoning.slice(0, 2).join('; ')}`);
  }

  if (analysis.key_challenges.length > 0) {
    assumptions.push(`Key visible challenge: ${analysis.key_challenges[0]}`);
  }

  if (analysis.photo_observations) {
    assumptions.push(`Photo observation: ${analysis.photo_observations}`);
  }

  addConfidenceAssumption(assumptions, analysis);

  const firstNote = analysis.estimation_notes.find(Boolean);
  if (firstNote) assumptions.push(`Photo-based planning note: ${firstNote}`);
}

function inferScopeLevelFromAnalysis(notes: string | undefined, analysis?: VisionAnalysis) {
  const text = `${notes || ''} ${analysis?.renovation_scope || ''} ${analysis?.customization_notes || ''}`.toLowerCase();

  if (
    /(full remodel|full renovation|gut|reconfigure|relocate|addition|expand|move plumbing|move wall|structural|tear out|down to studs)/.test(text) ||
    analysis?.current_condition === 'poor' ||
    analysis?.current_condition === 'damaged'
  ) {
    return 'full_remodel';
  }

  if (/(shower|tub|tile|vanity|cabinet|counter|backsplash|fixtures|refresh|update|replace)/.test(text) || analysis?.current_condition === 'dated') {
    return 'mid_refresh';
  }

  return 'cosmetic';
}

function inferRemodelSizeFromAnalysis(analysis?: VisionAnalysis): SizeKey {
  const inferred = analysis?.scope_signals.room_size || analysis?.estimated_size_bucket;
  if (inferred === 'small' || inferred === 'large') return inferred;
  return 'medium';
}

function estimateInteriorPaint(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const room = inferredRoomSize(scopeAnswers, analysis);
  const assumptions: string[] = [];
  resolveSizeConflict(room.userSize, room.analysisSize, 'room', assumptions);

  const paintScope = scopeAnswers.paint_scope || 'walls_only';
  const prepLevel = scopeAnswers.prep_level || 'light';
  const zipMultiplier = getZipMultiplier(zip);
  const openingAdjustments = getPaintOpeningAdjustments(analysis?.scope_signals.window_count_visible);
  const wallAreaMultiplier = areaBucketMultiplier(analysis?.area_signals.wall_area_bucket, 0.85, 1.15);

  const scopeRates: Record<string, { labor: number; materials: number; label: string }> = {
    walls_only: { labor: 1.45, materials: 0.28, label: 'walls only' },
    walls_and_ceiling: { labor: 1.85, materials: 0.38, label: 'walls and ceiling' },
    walls_ceiling_trim: { labor: 2.3, materials: 0.6, label: 'walls, ceiling, and trim' },
  };
  const prepMultiplierByLevel: Record<string, number> = { light: 1.0, medium: 1.16, heavy: 1.34 };
  const qualityAdjustment: Record<string, number> = { budget: 0.9, mid: 1.0, premium: 1.14 };
  const ceilingMultiplier = analysis?.scope_signals.ceiling_height === 'tall' ? 1.12 : analysis?.scope_signals.ceiling_height === 'vaulted' ? 1.18 : 1;
  const scopeRate = scopeRates[paintScope] ?? scopeRates.walls_only;
  const prepMultiplier = (prepMultiplierByLevel[prepLevel] ?? 1) * ceilingMultiplier;
  const grossWallArea = room.wallArea * wallAreaMultiplier;
  const paintableWallArea = grossWallArea * openingAdjustments.reductionFactor;
  const trimLinearFeet = paintScope === 'walls_ceiling_trim' ? Math.max(40, Math.round(room.floorArea / 2.5)) : 0;

  let labor = paintableWallArea * scopeRate.labor * prepMultiplier;
  let materials = paintableWallArea * scopeRate.materials * qualityAdjustment[qualityTier as QualityTier];

  if (paintScope === 'walls_and_ceiling') {
    labor += room.floorArea * 0.55 * prepMultiplier;
    materials += room.floorArea * 0.12 * qualityAdjustment[qualityTier as QualityTier];
  }

  if (paintScope === 'walls_ceiling_trim') {
    labor += room.floorArea * 0.6 * prepMultiplier + trimLinearFeet * 2.5 * openingAdjustments.trimLaborFactor;
    materials += room.floorArea * 0.14 * qualityAdjustment[qualityTier as QualityTier] + trimLinearFeet * 0.35;
  } else {
    labor *= openingAdjustments.trimLaborFactor;
  }

  const midBeforeRegional = (labor + materials) * qualityAdjustment[qualityTier as QualityTier];
  const minimumByScope: Record<string, number> = {
    walls_only: room.key === 'small' ? 500 : room.key === 'medium' ? 900 : 1300,
    walls_and_ceiling: room.key === 'small' ? 800 : room.key === 'medium' ? 1200 : 1800,
    walls_ceiling_trim: room.key === 'small' ? 1100 : room.key === 'medium' ? 1700 : 2500,
  };
  const mid = Math.max(midBeforeRegional * zipMultiplier, minimumByScope[paintScope] ?? 700);
  const spread = analysis?.confidence === 'low' ? 0.23 : room.key === 'small' && paintScope === 'walls_only' ? 0.16 : 0.19;
  const range = buildRange(mid, spread);
  const laborShare = Math.min(0.82, Math.max(0.66, labor / Math.max(labor + materials, 1)));
  const breakdown = buildEstimateBreakdown(range, laborShare);

  assumptions.push(
    `${room.key} room planning assumption using about ${room.floorArea} floor sq ft and ${Math.round(grossWallArea)} gross wall sq ft`,
    `${scopeRate.label} scope with ${prepLevel} prep`,
    `Paintable wall area modeled at about ${Math.round(paintableWallArea)} sq ft after visible opening deductions`,
    analysis?.area_signals.wall_area_bucket ? `Wall area signal of ${analysis.area_signals.wall_area_bucket} adjusted wall area by visible scale` : 'Wall area kept at a standard room-planning assumption',
    openingAdjustments.summary,
    analysis?.scope_signals.ceiling_height === 'tall' || analysis?.scope_signals.ceiling_height === 'vaulted'
      ? `${humanize(analysis.scope_signals.ceiling_height)} ceiling signal increased labor and prep allowance`
      : 'Standard ceiling height assumed',
  );
  addPhotoDrivenAssumptions(assumptions, analysis, 'interior_paint');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Wall repair, stain blocking, wallpaper removal, or heavy furniture moving can raise painter pricing',
      'Exact wall measurements, trim detail, and number of doors/windows should be confirmed onsite before quoting',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely paintable wall area, selected paint scope, prep intensity, visible window/opening deductions, trim-detail labor allowance, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateFlooring(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const assumptions: string[] = [];
  const { chosen: roomSize, userSize, analysisSize } = getPreferredSize(scopeAnswers, analysis, 'room_size', 'medium');
  resolveSizeConflict(userSize, analysisSize, 'flooring area', assumptions);

  const materialType = scopeAnswers.material_type;
  const demoRequired = scopeAnswers.demo_required;

  if (!materialType || !demoRequired) return null;

  const areaBySize: Record<string, number> = { small: 110, medium: 220, large: 420 };
  const pricingByMaterial: Record<string, Record<string, { labor: number; materials: number }>> = {
    lvp: { budget: { labor: 2.3, materials: 2.2 }, mid: { labor: 2.6, materials: 3.0 }, premium: { labor: 3.0, materials: 4.2 } },
    laminate: { budget: { labor: 2.1, materials: 1.8 }, mid: { labor: 2.4, materials: 2.6 }, premium: { labor: 2.9, materials: 3.8 } },
    engineered_hardwood: { budget: { labor: 3.2, materials: 4.6 }, mid: { labor: 3.8, materials: 6.1 }, premium: { labor: 4.6, materials: 8.8 } },
    tile: { budget: { labor: 5.0, materials: 3.2 }, mid: { labor: 6.0, materials: 4.8 }, premium: { labor: 7.5, materials: 6.8 } },
  };

  const floorAreaMultiplier = areaBucketMultiplier(analysis?.area_signals.floor_area_bucket, 0.85, 1.2);
  const area = Math.round((areaBySize[roomSize] ?? areaBySize.medium) * floorAreaMultiplier);
  const rates = pricingByMaterial[materialType]?.[qualityTier];
  if (!rates) return null;

  const demoRate = demoRequired === 'yes' ? (materialType === 'tile' ? 2.5 : 1.5) : 0;
  const transitionsAllowance = materialType === 'tile' ? 1.0 : 0.55;
  const wideComplexityFactor = analysis?.estimated_dimensions.width_bucket === 'wide' ? 1.05 : 1;
  const zipMultiplier = getZipMultiplier(zip);
  const labor = area * (rates.labor + demoRate + transitionsAllowance * 0.65) * wideComplexityFactor;
  const materials = area * (rates.materials + transitionsAllowance * 0.35);
  const mid = (labor + materials) * zipMultiplier;
  const spread = analysis?.confidence === 'low' ? 0.22 : materialType === 'tile' || demoRequired === 'yes' ? 0.18 : 0.14;
  const range = buildRange(mid, spread);
  const laborShare = Math.min(0.68, Math.max(0.52, labor / Math.max(labor + materials, 1)));
  const breakdown = buildEstimateBreakdown(range, laborShare);
  const installedRate = (labor + materials) / Math.max(area, 1);

  assumptions.push(
    `${roomSize} flooring scope using about ${area} sq ft`,
    analysis?.area_signals.floor_area_bucket ? `Floor area signal of ${analysis.area_signals.floor_area_bucket} adjusted the planning square footage` : 'Floor area kept at a standard room-planning assumption',
    `${materialType.replace(/_/g, ' ')} installed planning rate modeled around ${formatCurrency(installedRate)}/sq ft before spread`,
    demoRequired === 'yes' ? `Included demolition/removal allowance of about ${formatCurrency(demoRate)}/sq ft` : 'No demolition/removal allowance included',
    analysis?.estimated_dimensions.width_bucket === 'wide'
      ? 'Wide visible layout increased transition and trim-reset complexity slightly'
      : `Included a transitions and trim reset allowance of about ${formatCurrency(transitionsAllowance)}/sq ft`,
    'Area and installed rate remain planning-grade until exact square footage and substrate conditions are measured onsite',
  );
  addPhotoDrivenAssumptions(assumptions, analysis, 'flooring');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Subfloor repairs, leveling, moisture mitigation, transitions, stairs, and baseboard work can increase bids',
      'Tile layout, pattern changes, or moving heavy furniture/appliances can raise labor meaningfully',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely room square footage, selected flooring installed price band, demolition scope, transitions/trim allowance, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateBathroom(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis, notes?: string): EstimateResult | null {
  const scopeLevel = scopeAnswers.scope_level || inferScopeLevelFromAnalysis(notes, analysis);
  const bathroomSize = (scopeAnswers.bathroom_size as SizeKey | undefined) || inferRemodelSizeFromAnalysis(analysis);

  const baseMidByScope = getScopeMids('bathroom');
  const sizeMultiplierBySize: Record<string, number> = { small: 0.85, medium: 1.0, large: 1.25 };
  const conditionMultiplier = analysis?.current_condition === 'damaged' ? 1.16 : analysis?.current_condition === 'poor' ? 1.1 : analysis?.current_condition === 'dated' ? 1.05 : 1.0;
  const zipMultiplier = getZipMultiplier(zip);
  const scopeMid = baseMidByScope[scopeLevel] ?? baseMidByScope.mid_refresh ?? 22000;
  const mid = scopeMid * sizeMultiplierBySize[bathroomSize] * getQualityMultiplier(qualityTier) * conditionMultiplier * zipMultiplier;
  const range = buildRange(mid, analysis?.confidence === 'low' ? 0.24 : 0.2);
  const breakdown = buildEstimateBreakdown(range, 0.62);
  const assumptions = [
    `${scopeLevel.replace(/_/g, ' ')} bathroom scope`,
    `${bathroomSize} bathroom size multiplier applied`,
    `${qualityTier} finish multiplier applied`,
  ];
  addPhotoDrivenAssumptions(assumptions, analysis, 'bathroom');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Plumbing relocation, waterproofing repairs, and permit/code updates can materially raise final cost',
      'Older bathrooms often uncover hidden substrate or water damage once opened up',
    ],
    estimate_basis: withAnalysisBasis('Scope-based planning estimate using bathroom remodel tier, size multiplier, visible condition, finish level, and ZIP multiplier.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateKitchen(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis, notes?: string): EstimateResult | null {
  const scopeLevel = scopeAnswers.scope_level || inferScopeLevelFromAnalysis(notes, analysis);
  const kitchenSize = (scopeAnswers.kitchen_size as SizeKey | undefined) || inferRemodelSizeFromAnalysis(analysis);

  const baseMidByScope = getScopeMids('kitchen');
  const sizeMultiplierBySize: Record<string, number> = { small: 0.85, medium: 1.0, large: 1.3 };
  const conditionMultiplier = analysis?.current_condition === 'damaged' ? 1.18 : analysis?.current_condition === 'poor' ? 1.12 : analysis?.current_condition === 'dated' ? 1.06 : 1.0;
  const zipMultiplier = getZipMultiplier(zip);
  const scopeMid = baseMidByScope[scopeLevel] ?? baseMidByScope.mid_refresh ?? 42500;
  const mid = scopeMid * sizeMultiplierBySize[kitchenSize] * getQualityMultiplier(qualityTier) * conditionMultiplier * zipMultiplier;
  const range = buildRange(mid, analysis?.confidence === 'low' ? 0.22 : 0.18);
  const breakdown = buildEstimateBreakdown(range, 0.58);
  const assumptions = [
    `${scopeLevel.replace(/_/g, ' ')} kitchen scope`,
    `${kitchenSize} kitchen size multiplier applied`,
    `${qualityTier} finish multiplier applied`,
  ];
  addPhotoDrivenAssumptions(assumptions, analysis, 'kitchen');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Cabinet layout changes, electrical upgrades, and appliance moves can increase final kitchen bids',
      'Countertop selection and custom storage details often change pricing late in planning',
    ],
    estimate_basis: withAnalysisBasis('Scope-based planning estimate using kitchen remodel tier, size multiplier, visible condition, finish level, and ZIP multiplier.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function getVisibleSiteConstraints(analysis?: VisionAnalysis) {
  if (!analysis) return [] as string[];

  const haystack = [
    ...(analysis.visible_constraints || []),
    ...(analysis.visible_features || []),
    analysis.photo_observations || '',
  ].join(' | ');

  const labels = [
    /\bdriveway\b/i.test(haystack) ? 'driveway' : null,
    /\bwalkway\b|\bwalk\b|\bpath\b|\bsidewalk\b/i.test(haystack) ? 'walkway' : null,
    /\bpatio\b|\bpavers?\b/i.test(haystack) ? 'patio' : null,
    /\bsteps?\b|\bstairs?\b/i.test(haystack) ? 'steps' : null,
    /\bretaining\s+wall\b/i.test(haystack) ? 'retaining wall' : null,
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(labels));
}

function estimateLandscaping(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const yardSize = (scopeAnswers.yard_size as SizeKey | undefined)
    || analysis?.scope_signals.yard_size
    || (analysis?.estimated_size_bucket === 'small' || analysis?.estimated_size_bucket === 'large' ? analysis.estimated_size_bucket : undefined)
    || 'medium';
  const landscapeScope = scopeAnswers.landscape_scope || 'lawn_and_beds';
  const hardscapeScope = scopeAnswers.hardscape_scope || 'preserve_existing';
  const irrigationLighting = scopeAnswers.irrigation_lighting || 'none';

  if (!analysis && Object.keys(scopeAnswers).length === 0) return null;

  const baseMidByScope: Record<string, Record<SizeKey, number>> = {
    refresh_beds: { small: 3200, medium: 6500, large: 11000 },
    lawn_and_beds: { small: 6200, medium: 12000, large: 22000 },
    full_yard: { small: 9800, medium: 19000, large: 36000 },
  };
  const hardscapeAdders: Record<string, Record<SizeKey, number>> = {
    preserve_existing: { small: 0, medium: 0, large: 0 },
    light_updates: { small: 1800, medium: 4200, large: 7600 },
    new_hardscape: { small: 7000, medium: 14000, large: 26000 },
  };
  const systemsAdders: Record<string, Record<SizeKey, number>> = {
    none: { small: 0, medium: 0, large: 0 },
    irrigation: { small: 1800, medium: 3500, large: 6200 },
    irrigation_and_lighting: { small: 3800, medium: 7200, large: 12400 },
  };
  const complexityMultiplier: Record<string, number> = {
    simple: 0.96,
    moderate: 1.08,
    complex: 1.22,
  };

  const baseMid = baseMidByScope[landscapeScope]?.[yardSize] ?? baseMidByScope.lawn_and_beds.medium;
  const hardscapeAdder = hardscapeAdders[hardscapeScope]?.[yardSize] ?? 0;
  const systemsAdder = systemsAdders[irrigationLighting]?.[yardSize] ?? 0;
  const zipMultiplier = getZipMultiplier(zip);
  const qualityMultiplier = getQualityMultiplier(qualityTier);
  const complexity = analysis?.complexity ?? 'moderate';
  const accessMultiplier = analysis?.scope_signals.access_difficulty === 'difficult'
    ? 1.08
    : analysis?.scope_signals.access_difficulty === 'moderate'
      ? 1.03
      : 1;
  const yardAreaMultiplier = areaBucketMultiplier(analysis?.area_signals.yard_area_bucket, 0.9, 1.18);
  const mid = (baseMid + hardscapeAdder + systemsAdder) * qualityMultiplier * (complexityMultiplier[complexity] ?? 1.08) * accessMultiplier * yardAreaMultiplier * zipMultiplier;
  const spread = analysis?.confidence === 'low' ? 0.24 : hardscapeScope === 'new_hardscape' || landscapeScope === 'full_yard' ? 0.2 : 0.17;
  const range = buildRange(mid, spread);
  const breakdown = buildEstimateBreakdown(range, hardscapeScope === 'new_hardscape' ? 0.6 : 0.64);
  const visibleConstraints = getVisibleSiteConstraints(analysis);

  const assumptions = [
    `${yardSize} landscaping scope sized around a ${landscapeScope.replace(/_/g, ' ')}`,
    hardscapeScope === 'preserve_existing'
      ? 'Existing driveway, walkways, patio areas, and other visible hardscape were preserved, not rebuilt'
      : hardscapeScope === 'light_updates'
        ? 'Included only light hardscape touches like borders, edging, or small path adjustments'
        : 'Included meaningful hardscape work such as new or reworked paths, patio, pavers, or similar site features',
    irrigationLighting === 'none'
      ? 'No irrigation or lighting package included'
      : irrigationLighting === 'irrigation'
        ? 'Included an irrigation allowance'
        : 'Included irrigation and low-voltage lighting allowances',
    analysis?.area_signals.yard_area_bucket
      ? `Yard area signal of ${analysis.area_signals.yard_area_bucket} refined the visible landscape footprint`
      : 'Visible yard footprint kept at a standard planning assumption',
    visibleConstraints.length > 0
      ? `Visible fixed-site constraints like ${visibleConstraints.join(', ')} were treated as keep-in-place elements unless explicitly changed`
      : 'Visible hardscape and circulation areas were treated as keep-in-place unless explicitly changed',
    analysis?.scope_signals.access_difficulty === 'difficult'
      ? 'Difficult site access increased installation labor modestly'
      : 'Normal landscaping access assumed',
  ];
  addPhotoDrivenAssumptions(assumptions, analysis, 'landscaping');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Drainage correction, grading, irrigation trenching, tree/root conflicts, haul-off, and utility conflicts can materially change landscaping bids',
      'Exact bed area, plant count, sun exposure, soil condition, and any hardscape changes should be field-verified before quoting',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on visible yard scope, landscape program, preserved hardscape assumptions, systems allowances, and ZIP-based pricing.', analysis, 4),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateDeck(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const deckSize = scopeAnswers.deck_size;
  const materialType = scopeAnswers.material_type;
  const railing = scopeAnswers.railing;

  if (!deckSize || !materialType || !railing) return null;

  const areaBySize: Record<string, number> = { small: 110, medium: 220, large: 380 };
  const pricingByMaterial: Record<string, Record<string, { labor: number; materials: number }>> = {
    pressure_treated: { budget: { labor: 18, materials: 14 }, mid: { labor: 22, materials: 18 }, premium: { labor: 28, materials: 22 } },
    composite: { budget: { labor: 21, materials: 25 }, mid: { labor: 25, materials: 34 }, premium: { labor: 31, materials: 43 } },
    cedar_redwood: { budget: { labor: 20, materials: 22 }, mid: { labor: 24, materials: 30 }, premium: { labor: 29, materials: 38 } },
  };
  const railingRates: Record<string, { labor: number; materials: number }> = {
    pressure_treated: { labor: 55, materials: 35 },
    composite: { labor: 65, materials: 55 },
    cedar_redwood: { labor: 62, materials: 48 },
  };

  const yardMultiplier = areaBucketMultiplier(analysis?.area_signals.yard_area_bucket, 0.9, 1.18);
  const widthMultiplier = widthBucketMultiplier(analysis?.estimated_dimensions.width_bucket, 0.96, 1.08);
  const depthMultiplier = depthBucketMultiplier(analysis?.estimated_dimensions.depth_bucket, 0.97, 1.1);
  const area = Math.round(areaBySize[deckSize] * yardMultiplier * widthMultiplier * depthMultiplier);
  const rates = pricingByMaterial[materialType]?.[qualityTier];
  if (!area || !rates) return null;

  const estimatedPerimeter = Math.round((deckSize === 'small' ? 32 : deckSize === 'medium' ? 48 : 64) * Math.max(widthMultiplier, depthMultiplier));
  const hasRailing = railing === 'yes';
  let labor = area * rates.labor;
  let materials = area * rates.materials;

  if (hasRailing) {
    const railingRate = railingRates[materialType] ?? railingRates.pressure_treated;
    labor += estimatedPerimeter * railingRate.labor;
    materials += estimatedPerimeter * railingRate.materials;
  }

  if (analysis?.scope_signals.access_difficulty === 'difficult') labor *= 1.1;

  const zipMultiplier = getZipMultiplier(zip);
  const mid = (labor + materials) * zipMultiplier;
  const range = buildRange(mid, analysis?.confidence === 'low' ? 0.22 : hasRailing ? 0.18 : 0.15);
  const laborShare = Math.min(0.72, Math.max(0.58, labor / Math.max(labor + materials, 1)));
  const breakdown = buildEstimateBreakdown(range, laborShare);

  return {
    ...range,
    assumptions: [
      `${deckSize} deck/patio planning scope using about ${area} sq ft`,
      analysis?.area_signals.yard_area_bucket ? `Yard area signal of ${analysis.area_signals.yard_area_bucket} refined the likely outdoor footprint` : 'Outdoor footprint kept at a standard planning assumption',
      `${materialType.replace(/_/g, ' ')} deck structure and boards priced separately from railing allowances`,
      hasRailing ? `Included about ${estimatedPerimeter} linear ft of matching railing allowance` : 'No railing allowance included',
      analysis?.estimated_dimensions.width_bucket === 'wide' || analysis?.estimated_dimensions.depth_bucket === 'deep'
        ? 'Wide/deep backyard cues allowed a larger visible deck footprint assumption'
        : 'No oversized backyard cues were used in the footprint assumption',
      analysis?.scope_signals.access_difficulty === 'difficult' ? 'Difficult access signal increased framing and install labor' : 'Normal backyard access assumed',
      ...(analysis?.size_reasoning.length ? [`Visible size cues: ${analysis.size_reasoning.slice(0, 2).join('; ')}`] : []),
    ],
    risk_notes: [
      'Footings, stairs, permit requirements, demolition, height off grade, and guardrail code rules can increase pricing',
      'Soil conditions, attachment details, and site access should be verified before quoting',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely deck area, selected decking material, railing scope, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateRoofing(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const roofSize = scopeAnswers.roof_size;
  const materialType = scopeAnswers.material_type;
  const tearOff = scopeAnswers.tear_off;

  if (!roofSize || !materialType || !tearOff) return null;

  const areaBySize: Record<string, number> = { small: 1300, medium: 2100, large: 3200 };
  const pricingByMaterial: Record<string, Record<string, { labor: number; materials: number }>> = {
    asphalt: { budget: { labor: 2.5, materials: 2.1 }, mid: { labor: 2.9, materials: 2.8 }, premium: { labor: 3.4, materials: 3.7 } },
    architectural_shingle: { budget: { labor: 2.8, materials: 2.7 }, mid: { labor: 3.2, materials: 3.5 }, premium: { labor: 3.9, materials: 4.8 } },
    metal: { budget: { labor: 4.5, materials: 5.0 }, mid: { labor: 5.4, materials: 7.6 }, premium: { labor: 6.2, materials: 10.5 } },
  };

  const areaMultiplier = areaBucketMultiplier(analysis?.area_signals.roof_area_bucket, 0.85, 1.18) * widthBucketMultiplier(analysis?.estimated_dimensions.width_bucket, 0.96, 1.08);
  const area = Math.round((areaBySize[roofSize] ?? areaBySize.medium) * areaMultiplier);
  const rates = pricingByMaterial[materialType]?.[qualityTier];
  if (!area || !rates) return null;

  const stories = analysis?.scope_signals.stories ?? 1;
  const complexity = analysis?.scope_signals.roof_complexity ?? 'medium';
  const difficultAccess = analysis?.scope_signals.access_difficulty === 'difficult';

  let labor = area * rates.labor;
  let materials = area * rates.materials;

  if (tearOff === 'yes') {
    labor += area * 0.95;
    materials += area * 0.18;
  }

  let laborMultiplier = 1;
  if (stories === 2) laborMultiplier += 0.08;
  if (stories >= 3) laborMultiplier += 0.14;
  if (complexity === 'high') laborMultiplier += 0.1;
  if (complexity === 'low') laborMultiplier -= 0.04;
  if (difficultAccess) laborMultiplier += 0.08;
  if (roofSize === 'small' && complexity !== 'high') laborMultiplier -= 0.03;
  if (analysis?.estimated_dimensions.width_bucket === 'wide') laborMultiplier += 0.03;

  labor *= laborMultiplier;
  if (complexity === 'high') materials *= 1.04;

  const zipMultiplier = getZipMultiplier(zip);
  const mid = (labor + materials) * zipMultiplier;
  const spread = analysis?.confidence === 'low' ? 0.22 : materialType === 'metal' || complexity === 'high' ? 0.17 : 0.14;
  const range = buildRange(mid, spread);
  const laborShare = Math.min(0.74, Math.max(0.58, labor / Math.max(labor + materials, 1)));
  const breakdown = buildEstimateBreakdown(range, laborShare);

  const assumptions = [
    `${roofSize} roof planning assumption using about ${area.toLocaleString()} inferred roofing sq ft`,
    analysis?.area_signals.roof_area_bucket ? `Roof area signal of ${analysis.area_signals.roof_area_bucket} refined the base roof footprint` : 'Roof area kept at a standard planning assumption',
    `${materialType.replace(/_/g, ' ')} roof priced with separate labor and material allowances`,
    tearOff === 'yes' ? 'Included full tear-off and disposal allowance' : 'Overlay/no tear-off assumption used',
    stories > 1 ? `${stories}-story access increased labor allowance modestly` : 'Single-story access assumption used',
    complexity === 'high' ? 'High roof complexity increased detail labor and waste allowance, but multipliers were kept measured' : `Roof complexity assumed ${complexity}`,
    analysis?.estimated_dimensions.width_bucket === 'wide' ? 'Wide visible roofline increased labor and layout allowance modestly' : 'No extra width-based roof layout allowance applied',
    difficultAccess ? 'Difficult access increased labor allowance modestly' : 'Normal access assumed',
    'Roof square footage is inferred from scope answers and visible scale cues, not measured from plans or a roof report',
  ];
  addPhotoDrivenAssumptions(assumptions, analysis, 'roofing');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Decking replacement, flashing detail, ventilation upgrades, permit rules, and steep pitch can increase final cost',
      'Insurance scope, chimney/skylight work, and exact measurements should be confirmed onsite',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely roof size, selected roofing material, tear-off scope, measured labor adjustments for stories/access/complexity, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateExteriorPaint(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  if (!analysis) return null;

  const assumptions: string[] = [];
  const userSize = scopeAnswers.exterior_size as SizeKey | undefined;
  const analysisSize = analysis.estimated_size_bucket as SizeKey | undefined;
  const sizeKey = userSize || analysisSize || 'medium';
  resolveSizeConflict(userSize, analysisSize, 'exterior', assumptions);

  const stories = analysis.scope_signals.stories ?? 1;
  const visibleWindows = analysis.scope_signals.window_count_visible ?? 0;
  const complexity = analysis.scope_signals.paint_complexity ?? 'medium';
  const openingAdjustments = getPaintOpeningAdjustments(visibleWindows);
  const sizeProfiles: Record<string, { surfaceArea: number; trimLinearFeet: number }> = {
    small: { surfaceArea: 1250, trimLinearFeet: 140 },
    medium: { surfaceArea: 2100, trimLinearFeet: 220 },
    large: { surfaceArea: 3200, trimLinearFeet: 320 },
  };
  const qualityRates: Record<string, { labor: number; materials: number }> = {
    budget: { labor: 2.05, materials: 0.62 },
    mid: { labor: 2.45, materials: 0.88 },
    premium: { labor: 2.95, materials: 1.24 },
  };

  const areaMultiplier = areaBucketMultiplier(analysis.area_signals.wall_area_bucket, 0.88, 1.15);
  const widthMultiplier = widthBucketMultiplier(analysis.estimated_dimensions.width_bucket, 0.96, 1.08);
  const depthMultiplier = depthBucketMultiplier(analysis.estimated_dimensions.depth_bucket, 0.97, 1.05);
  const sizeProfile = sizeProfiles[sizeKey] ?? sizeProfiles.medium;
  const rates = qualityRates[qualityTier] ?? qualityRates.mid;
  const adjustedSurfaceArea = sizeProfile.surfaceArea * areaMultiplier * widthMultiplier * depthMultiplier;
  const paintableArea = adjustedSurfaceArea * openingAdjustments.reductionFactor;
  let labor = paintableArea * rates.labor;
  let materials = paintableArea * rates.materials;
  labor += sizeProfile.trimLinearFeet * 2.4 * openingAdjustments.trimLaborFactor;
  materials += sizeProfile.trimLinearFeet * 0.28;

  if (stories === 2) labor *= 1.1;
  if (stories >= 3) labor *= 1.18;
  if (complexity === 'high') {
    labor *= 1.12;
    materials *= 1.05;
  } else if (complexity === 'low') {
    labor *= 0.95;
  }

  if (analysis.estimated_dimensions.width_bucket === 'wide' && stories >= 2) {
    labor *= 1.05;
  }

  if (sizeKey === 'small' && stories === 1 && visibleWindows <= 2 && complexity === 'low') {
    labor *= 0.93;
    materials *= 0.96;
  }

  if (sizeKey === 'large' && stories >= 2 && visibleWindows >= 6 && complexity === 'high') {
    labor *= 1.08;
    materials *= 1.04;
  }

  const zipMultiplier = getZipMultiplier(zip);
  const mid = (labor + materials) * zipMultiplier;
  const spread = analysis.confidence === 'low' ? 0.22 : complexity === 'high' || stories >= 3 ? 0.18 : 0.15;
  const range = buildRange(mid, spread);
  const laborShare = Math.min(0.8, Math.max(0.68, labor / Math.max(labor + materials, 1)));
  const breakdown = buildEstimateBreakdown(range, laborShare);

  assumptions.push(
    `${sizeKey} exterior size bucket using about ${Math.round(adjustedSurfaceArea).toLocaleString()} gross paintable sq ft of siding and trim surfaces`,
    analysis.area_signals.wall_area_bucket ? `Wall area signal of ${analysis.area_signals.wall_area_bucket} refined the facade surface assumption` : 'Facade wall area kept at a standard exterior planning assumption',
    `Visible openings reduced modeled body paint area to about ${Math.round(paintableArea).toLocaleString()} sq ft while trim/detail labor stayed active`,
    stories ? `${stories}-story access assumption applied` : 'Story count not confidently visible',
    openingAdjustments.summary,
    complexity ? `${complexity} paint complexity signal used for trim/detail labor` : 'Standard exterior paint complexity assumed',
    analysis.estimated_dimensions.width_bucket === 'wide' && stories >= 2 && visibleWindows >= 4
      ? 'Wide multi-story facade with many windows increased trim, ladder, and masking labor assumptions'
      : 'No major facade width-driven trim premium was added',
  );
  addPhotoDrivenAssumptions(assumptions, analysis, 'exterior_paint');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Scraping, peeling remediation, carpentry repairs, lead-safe prep, and lift/scaffold needs can materially increase cost',
      'Exact elevations, trim detail, shutters, detached structures, and paint condition should be confirmed onsite',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on exterior surface size bucket, visible openings, story count, trim-detail complexity, finish tier, and ZIP-based pricing.', analysis, 4),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateCustomProject(category: string, qualityTier: string, zip: string, analysis?: VisionAnalysis, notes?: string): EstimateResult | null {
  if (category !== 'custom_project') return null;

  const zipMultiplier = getZipMultiplier(zip);
  const trade = analysis?.suggested_trade ?? 'unknown';
  const locationType = analysis?.suggested_location_type ?? 'unknown';
  const sizeBucket = analysis?.estimated_size_bucket ?? 'medium';
  const complexity = analysis?.complexity ?? 'moderate';

  const mappedCategory = trade === 'paint'
    ? locationType === 'exterior' ? 'exterior_paint' : 'interior_paint'
    : trade === 'flooring' ? 'flooring'
    : trade === 'roofing' ? 'roofing'
    : trade === 'deck' ? 'deck_patio'
    : trade === 'landscaping' ? 'landscaping'
    : trade === 'bathroom' ? 'bathroom'
    : trade === 'kitchen' ? 'kitchen'
    : null;

  if (mappedCategory) {
    const mapped = fallbackEstimate(mappedCategory, qualityTier, zip, notes);
    const assumptions = [
      `Custom project scope was inferred most closely as ${mappedCategory.replace(/_/g, ' ')} from uploaded photo analysis and homeowner notes`,
      ...mapped.assumptions,
      'Estimate remains planning-grade until exact onsite scope and quantities are confirmed',
    ];
    addPhotoDrivenAssumptions(assumptions, analysis, 'custom_project');

    return {
      ...mapped,
      assumptions,
      risk_notes: [
        'Custom-project pricing may change once hidden scope, sequencing, and exact measurements are confirmed onsite',
        ...mapped.risk_notes,
      ],
      estimate_basis: `Custom project estimate, very explicitly inferred as ${mappedCategory.replace(/_/g, ' ')} from the uploaded image analysis${trade !== 'unknown' ? ` and inferred ${trade.replace(/_/g, ' ')} trade signal` : ''}.`,
      regional_notes: getRegionalNotes(zip, zipMultiplier),
      estimate_breakdown: mapped.estimate_breakdown,
    };
  }

  const baseMidBySize: Record<string, number> = { small: 3500, medium: 9000, large: 18000 };
  const complexityMultiplier: Record<string, number> = { simple: 1.0, moderate: 1.25, complex: 1.6 };
  const qualityMultiplier = getQualityMultiplier(qualityTier);
  const mid = (baseMidBySize[sizeBucket] ?? 9000) * (complexityMultiplier[complexity] ?? 1.25) * qualityMultiplier * zipMultiplier;
  const range = buildRange(mid, analysis?.confidence === 'low' ? 0.26 : 0.22);
  const breakdown = buildEstimateBreakdown(range, 0.68);
  const assumptions = [
    'This is a mixed-scope planning estimate for a custom project',
    'Estimate is based on uploaded photo analysis and homeowner description',
    `${sizeBucket} size bucket and ${complexity} complexity assumptions were used`,
    trade && trade !== 'unknown' ? `Likely primary trade was inferred as ${trade.replace(/_/g, ' ')}` : 'No single trade was confidently inferred from the image',
    'Exact pricing depends on onsite scope definition and verified quantities',
  ];
  addPhotoDrivenAssumptions(assumptions, analysis, 'custom_project');

  return {
    ...range,
    assumptions,
    risk_notes: [
      'Custom-project scope gaps, trade overlap, and hidden conditions can move pricing materially',
      'A contractor site visit is needed to narrow demolition, framing, finish, and permit assumptions',
    ],
    estimate_basis: trade && trade !== 'unknown'
      ? `Custom project estimate based on mixed-scope remodel assumptions with an explicitly inferred ${trade.replace(/_/g, ' ')} trade from uploaded image analysis.`
      : 'Custom project estimate based on mixed-scope remodel assumptions from uploaded image analysis.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function fallbackEstimate(category: string, qualityTier: string, zip: string, notes?: string): EstimateResult {
  const baseMid: Record<string, number> = {
    roofing: 16000,
    exterior_paint: 7000,
    deck_patio: 18000,
    landscaping: 10000,
    kitchen: 35000,
    bathroom: 18000,
    flooring: 8000,
    interior_paint: 4500,
    custom_project: 9000,
  };

  let mid = baseMid[category] ?? 15000;
  const zipMultiplier = getZipMultiplier(zip);

  if (qualityTier === 'budget') mid *= 0.75;
  if (qualityTier === 'premium') mid *= 1.45;
  mid *= zipMultiplier;

  const range = buildRange(mid, 0.22);
  const laborShareByCategory: Record<string, number> = {
    roofing: 0.62,
    exterior_paint: 0.74,
    deck_patio: 0.63,
    landscaping: 0.6,
    kitchen: 0.56,
    bathroom: 0.6,
    flooring: 0.57,
    interior_paint: 0.76,
    custom_project: 0.68,
  };
  const breakdown = buildEstimateBreakdown(range, laborShareByCategory[category] ?? 0.62);

  return {
    ...range,
    assumptions: [
      `${qualityTier} quality finishes and materials`,
      `Typical labor rates for ZIP ${zip}`,
      `Standard scope for a ${category.replace(/_/g, ' ')} project`,
      notes ? 'Included homeowner notes in planning assumptions' : 'No unusual site constraints assumed',
    ],
    risk_notes: [
      'Hidden damage, code upgrades, or site conditions can increase costs',
      'Final contractor pricing may vary based on measurements and material selections',
    ],
    estimate_basis: 'Fallback planning estimate based on project category benchmarks, quality tier, and ZIP-based regional adjustment.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: breakdown,
  };
}

function estimateDeterministically(category: string, scopeAnswers: ScopeAnswers | undefined, qualityTier: string, zip: string, analysis?: VisionAnalysis, notes?: string): EstimateResult | null {
  if (category === 'custom_project') {
    return estimateCustomProject(category, qualityTier, zip, analysis, notes);
  }

  if (category === 'exterior_paint' && analysis) {
    return estimateExteriorPaint(scopeAnswers || {}, qualityTier, zip, analysis);
  }

  if (category === 'landscaping') {
    return estimateLandscaping(scopeAnswers || {}, qualityTier, zip, analysis);
  }

  if ((!scopeAnswers || Object.keys(scopeAnswers).length === 0) && !analysis) return null;

  const estimators: Record<string, (answers: ScopeAnswers, tier: string, zipCode: string, analysis?: VisionAnalysis) => EstimateResult | null> = {
    interior_paint: estimateInteriorPaint,
    flooring: estimateFlooring,
    bathroom: (answers, tier, zipCode, analysisValue) => estimateBathroom(answers, tier, zipCode, analysisValue, notes),
    kitchen: (answers, tier, zipCode, analysisValue) => estimateKitchen(answers, tier, zipCode, analysisValue, notes),
    deck_patio: estimateDeck,
    roofing: estimateRoofing,
  };

  const estimator = estimators[category];
  return estimator ? estimator(scopeAnswers || {}, qualityTier, zip, analysis) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    const analysis = getAnalysis(params.analysis);

    let result = estimateDeterministically(params.category, params.scope_answers, params.quality_tier, params.zip_code, analysis, params.notes);

    if (!result) {
      try {
        const { system, user } = buildEstimationPrompt({
          category: params.category,
          locationType: params.location_type,
          style: params.style,
          qualityTier: params.quality_tier,
          zipCode: params.zip_code,
          notes: params.notes,
          scopeAnswers: params.scope_answers,
          analysis,
        });
        result = await parseClaudeJSON<EstimateResult>(system, user);
      } catch (aiError) {
        console.error('estimate ai fallback:', aiError);
        result = fallbackEstimate(params.category, params.quality_tier, params.zip_code, params.notes);
      }
    }

    if (analysis) {
      result.estimate_basis = withAnalysisBasis(result.estimate_basis, analysis, 4);
      addConfidenceAssumption(result.assumptions, analysis);
    }

    result = applyEstimateGuardrails(params.category, result);

    const { data, error } = await supabaseAdmin
      .from('estimates')
      .insert({
        project_id: params.project_id,
        low_estimate: result.low_estimate,
        mid_estimate: result.mid_estimate,
        high_estimate: result.high_estimate,
        assumptions: result.assumptions,
        risk_notes: result.risk_notes,
        estimate_basis: result.estimate_basis,
      })
      .select()
      .single();

    if (error) throw error;

    const analysisSummary = buildAnalysisSummary(analysis);
    const nextNotes = analysisSummary
      ? `${params.notes?.trim() ? `${params.notes.trim()}\n\n` : ''}${analysisSummary}`
      : params.notes;

    await supabaseAdmin.from('projects').update({ status: 'estimated', notes: nextNotes }).eq('id', params.project_id);

    return NextResponse.json({ estimate: { ...data, regional_notes: result.regional_notes, estimate_breakdown: result.estimate_breakdown } });
  } catch (error) {
    console.error('estimate error:', error);
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 });
  }
}
