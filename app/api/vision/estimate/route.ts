import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildEstimationPrompt } from '@/lib/prompts';
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

interface EstimateResult {
  low_estimate: number;
  mid_estimate: number;
  high_estimate: number;
  assumptions: string[];
  risk_notes: string[];
  estimate_basis: string;
  regional_notes?: string;
  estimate_breakdown?: string;
}

type ScopeAnswers = Record<string, string>;
type QualityTier = 'budget' | 'mid' | 'premium';

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

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;

  const partial = input as Partial<VisionAnalysis>;
  return {
    ...FALLBACK_VISION_ANALYSIS,
    ...partial,
    visible_features: Array.isArray(partial.visible_features) ? partial.visible_features : [],
    estimation_notes: Array.isArray(partial.estimation_notes) ? partial.estimation_notes : [],
    materials_signals: Array.isArray(partial.materials_signals) ? partial.materials_signals : [],
    scope_signals: {
      ...FALLBACK_VISION_ANALYSIS.scope_signals,
      ...(partial.scope_signals || {}),
    },
  };
}

function withAnalysisBasis(defaultBasis: string, analysis?: VisionAnalysis, maxFacts = 3) {
  const facts = describeAnalysisFacts(analysis).slice(0, maxFacts);
  if (facts.length === 0) return defaultBasis;
  return `Scope-based planning estimate using uploaded photo analysis (${facts.join(', ')}), project category assumptions, and ZIP-based labor adjustment.`;
}

function inferredRoomSize(scopeAnswers: ScopeAnswers, analysis?: VisionAnalysis) {
  const explicit = scopeAnswers.room_size || analysis?.scope_signals.room_size || 'medium';
  if (explicit === 'small') return { key: 'small', floorArea: 100, wallArea: 260 };
  if (explicit === 'large') return { key: 'large', floorArea: 260, wallArea: 620 };
  return { key: 'medium', floorArea: 170, wallArea: 420 };
}

function getWindowReduction(windowCoverage?: string, visibleWindows?: number) {
  if (windowCoverage === 'many_windows') return 0.76;
  if (windowCoverage === 'some_windows') return 0.9;
  if ((visibleWindows ?? 0) >= 5) return 0.78;
  if ((visibleWindows ?? 0) >= 3) return 0.88;
  return 0.96;
}

function getEstimateBreakdown(mid: number, laborShare: number) {
  const labor = roundToHundred(mid * laborShare);
  const materials = roundToHundred(Math.max(mid - labor, 0));
  return `Estimated split: ~${Math.round(laborShare * 100)}% labor / ${Math.round((1 - laborShare) * 100)}% materials (about ${formatCurrency(labor)} labor and ${formatCurrency(materials)} materials).`;
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function estimateInteriorPaint(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const room = inferredRoomSize(scopeAnswers, analysis);
  const paintScope = scopeAnswers.paint_scope || 'walls_only';
  const prepLevel = scopeAnswers.prep_level || 'light';
  const windowCoverage = scopeAnswers.window_coverage || ((analysis?.scope_signals.window_count_visible ?? 0) >= 4 ? 'many_windows' : 'normal');
  const zipMultiplier = getZipMultiplier(zip);

  const scopeRates: Record<string, { labor: number; materials: number; label: string }> = {
    walls_only: { labor: 1.45, materials: 0.28, label: 'walls only' },
    walls_and_ceiling: { labor: 1.85, materials: 0.38, label: 'walls and ceiling' },
    walls_ceiling_trim: { labor: 2.3, materials: 0.6, label: 'walls, ceiling, and trim' },
  };
  const prepMultiplierByLevel: Record<string, number> = { light: 1.0, medium: 1.16, heavy: 1.34 };
  const qualityAdjustment: Record<string, number> = { budget: 0.9, mid: 1.0, premium: 1.14 };
  const ceilingMultiplier = analysis?.scope_signals.ceiling_height === 'tall' ? 1.12 : 1;
  const scopeRate = scopeRates[paintScope] ?? scopeRates.walls_only;
  const prepMultiplier = (prepMultiplierByLevel[prepLevel] ?? 1) * ceilingMultiplier;
  const paintableWallArea = room.wallArea * getWindowReduction(windowCoverage, analysis?.scope_signals.window_count_visible ?? 0);
  const trimLinearFeet = paintScope === 'walls_ceiling_trim' ? Math.max(40, Math.round(room.floorArea / 2.5)) : 0;

  let labor = paintableWallArea * scopeRate.labor * prepMultiplier;
  let materials = paintableWallArea * scopeRate.materials * qualityAdjustment[qualityTier];

  if (paintScope === 'walls_and_ceiling') {
    labor += room.floorArea * 0.55 * prepMultiplier;
    materials += room.floorArea * 0.12 * qualityAdjustment[qualityTier];
  }

  if (paintScope === 'walls_ceiling_trim') {
    labor += room.floorArea * 0.6 * prepMultiplier + trimLinearFeet * 2.5;
    materials += room.floorArea * 0.14 * qualityAdjustment[qualityTier] + trimLinearFeet * 0.35;
  }

  const midBeforeRegional = (labor + materials) * qualityAdjustment[qualityTier];
  const minimumByScope: Record<string, number> = {
    walls_only: room.key === 'small' ? 500 : room.key === 'medium' ? 900 : 1300,
    walls_and_ceiling: room.key === 'small' ? 800 : room.key === 'medium' ? 1200 : 1800,
    walls_ceiling_trim: room.key === 'small' ? 1100 : room.key === 'medium' ? 1700 : 2500,
  };
  const mid = Math.max(midBeforeRegional * zipMultiplier, minimumByScope[paintScope] ?? 700);
  const spread = room.key === 'small' && paintScope === 'walls_only' ? 0.16 : 0.19;
  const range = buildRange(mid, spread);
  const laborShare = Math.min(0.82, Math.max(0.66, labor / Math.max(labor + materials, 1)));

  return {
    ...range,
    assumptions: [
      `${room.key} room planning assumption using about ${room.floorArea} floor sq ft and ${Math.round(room.wallArea)} gross wall sq ft`,
      `${scopeRate.label} scope with ${prepLevel} prep`,
      windowCoverage === 'many_windows'
        ? 'Paintable wall area reduced heavily for many windows and openings'
        : windowCoverage === 'some_windows'
        ? 'Paintable wall area reduced modestly for visible windows and openings'
        : 'Standard window/opening deduction applied',
      analysis?.scope_signals.ceiling_height === 'tall' ? 'Tall ceiling signal increased labor and prep allowance' : 'Standard ceiling height assumed',
      getEstimateBreakdown(mid, laborShare),
    ],
    risk_notes: [
      'Wall repair, stain blocking, wallpaper removal, or heavy furniture moving can raise painter pricing',
      'Exact wall measurements, trim detail, and number of doors/windows should be confirmed onsite before quoting',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely paintable wall area, selected paint scope, prep intensity, visible window/opening deductions, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, laborShare),
  };
}

function estimateFlooring(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  const roomSize = scopeAnswers.room_size || analysis?.scope_signals.room_size || 'medium';
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

  const area = areaBySize[roomSize] ?? areaBySize.medium;
  const rates = pricingByMaterial[materialType]?.[qualityTier];
  if (!rates) return null;

  const demoRate = demoRequired === 'yes' ? (materialType === 'tile' ? 2.5 : 1.5) : 0;
  const zipMultiplier = getZipMultiplier(zip);
  const labor = area * (rates.labor + demoRate);
  const materials = area * rates.materials;
  const mid = (labor + materials) * zipMultiplier;
  const spread = materialType === 'tile' || demoRequired === 'yes' ? 0.18 : 0.14;
  const range = buildRange(mid, spread);
  const laborShare = labor / Math.max(labor + materials, 1);
  const installedBandLow = roundToHundred(area * (rates.labor + rates.materials) * 0.9 * zipMultiplier);
  const installedBandHigh = roundToHundred(area * (rates.labor + rates.materials) * 1.1 * zipMultiplier);

  return {
    ...range,
    assumptions: [
      `${roomSize} flooring scope using about ${area} sq ft`,
      `${materialType.replace(/_/g, ' ')} installed pricing modeled at roughly ${formatCurrency((rates.labor + rates.materials) * area * zipMultiplier / area)}/sq ft before spread`,
      demoRequired === 'yes' ? `Included demolition/removal allowance of about ${formatCurrency(demoRate)}/sq ft` : 'No demolition/removal allowance included',
      `Installed ${materialType.replace(/_/g, ' ')} planning band is about ${formatCurrency(installedBandLow)} to ${formatCurrency(installedBandHigh)} before trade-specific site adjustments`,
      getEstimateBreakdown(mid, laborShare),
    ],
    risk_notes: [
      'Subfloor repairs, leveling, moisture mitigation, transitions, stairs, and baseboard work can increase bids',
      'Tile layout, pattern changes, or moving heavy furniture/appliances can raise labor meaningfully',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely room square footage, selected flooring material installed price band, demolition scope, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, laborShare),
  };
}

function estimateBathroom(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string): EstimateResult | null {
  const scopeLevel = scopeAnswers.scope_level;
  const bathroomSize = scopeAnswers.bathroom_size;

  if (!scopeLevel || !bathroomSize) return null;

  const baseMidByScope: Record<string, number> = { cosmetic: 9000, mid_refresh: 18000, full_remodel: 30000 };
  const sizeMultiplierBySize: Record<string, number> = { small: 0.85, medium: 1.0, large: 1.25 };
  const zipMultiplier = getZipMultiplier(zip);
  const mid = baseMidByScope[scopeLevel] * sizeMultiplierBySize[bathroomSize] * getQualityMultiplier(qualityTier) * zipMultiplier;
  const range = buildRange(mid, 0.2);

  return {
    ...range,
    assumptions: [
      `${scopeLevel.replace(/_/g, ' ')} bathroom scope`,
      `${bathroomSize} bathroom size multiplier applied`,
      `${qualityTier} finish multiplier applied`,
      getEstimateBreakdown(mid, 0.62),
    ],
    risk_notes: [
      'Plumbing relocation, waterproofing repairs, and permit/code updates can materially raise final cost',
      'Older bathrooms often uncover hidden substrate or water damage once opened up',
    ],
    estimate_basis: 'Scope-based planning estimate using bathroom remodel tier, size multiplier, finish level, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, 0.62),
  };
}

function estimateKitchen(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string): EstimateResult | null {
  const scopeLevel = scopeAnswers.scope_level;
  const kitchenSize = scopeAnswers.kitchen_size;

  if (!scopeLevel || !kitchenSize) return null;

  const baseMidByScope: Record<string, number> = { cosmetic: 18000, mid_refresh: 35000, full_remodel: 65000 };
  const sizeMultiplierBySize: Record<string, number> = { small: 0.85, medium: 1.0, large: 1.3 };
  const zipMultiplier = getZipMultiplier(zip);
  const mid = baseMidByScope[scopeLevel] * sizeMultiplierBySize[kitchenSize] * getQualityMultiplier(qualityTier) * zipMultiplier;
  const range = buildRange(mid, 0.18);

  return {
    ...range,
    assumptions: [
      `${scopeLevel.replace(/_/g, ' ')} kitchen scope`,
      `${kitchenSize} kitchen size multiplier applied`,
      `${qualityTier} finish multiplier applied`,
      getEstimateBreakdown(mid, 0.58),
    ],
    risk_notes: [
      'Cabinet layout changes, electrical upgrades, and appliance moves can increase final kitchen bids',
      'Countertop selection and custom storage details often change pricing late in planning',
    ],
    estimate_basis: 'Scope-based planning estimate using kitchen remodel tier, size multiplier, finish level, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, 0.58),
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

  const area = areaBySize[deckSize];
  const rates = pricingByMaterial[materialType]?.[qualityTier];
  if (!area || !rates) return null;

  const estimatedPerimeter = deckSize === 'small' ? 32 : deckSize === 'medium' ? 48 : 64;
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
  const range = buildRange(mid, hasRailing ? 0.18 : 0.15);
  const laborShare = labor / Math.max(labor + materials, 1);

  return {
    ...range,
    assumptions: [
      `${deckSize} deck/patio planning scope using about ${area} sq ft`,
      `${materialType.replace(/_/g, ' ')} deck structure and boards priced separately from railing allowances`,
      hasRailing ? `Included about ${estimatedPerimeter} linear ft of matching railing allowance` : 'No railing allowance included',
      analysis?.scope_signals.access_difficulty === 'difficult' ? 'Difficult access signal increased framing and install labor' : 'Normal backyard access assumed',
      getEstimateBreakdown(mid, laborShare),
    ],
    risk_notes: [
      'Footings, stairs, permit requirements, demolition, height off grade, and guardrail code rules can increase pricing',
      'Soil conditions, attachment details, and site access should be verified before quoting',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely deck area, selected decking material, railing scope, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, laborShare),
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

  const area = areaBySize[roofSize];
  const rates = pricingByMaterial[materialType]?.[qualityTier];
  if (!area || !rates) return null;

  let labor = area * rates.labor;
  let materials = area * rates.materials;

  if (tearOff === 'yes') {
    labor += area * 0.95;
    materials += area * 0.18;
  }

  const stories = analysis?.scope_signals.stories ?? 1;
  const complexity = analysis?.scope_signals.roof_complexity ?? 'medium';
  const difficultAccess = analysis?.scope_signals.access_difficulty === 'difficult';

  if (stories === 2) labor *= 1.14;
  if (stories >= 3) labor *= 1.24;
  if (complexity === 'high') {
    labor *= 1.18;
    materials *= 1.05;
  } else if (complexity === 'low') {
    labor *= 0.96;
  }
  if (difficultAccess) labor *= 1.1;
  if (roofSize === 'small' && complexity !== 'high') labor *= 0.94;

  const zipMultiplier = getZipMultiplier(zip);
  const mid = (labor + materials) * zipMultiplier;
  const spread = materialType === 'metal' || complexity === 'high' ? 0.17 : 0.14;
  const range = buildRange(mid, spread);
  const laborShare = labor / Math.max(labor + materials, 1);

  return {
    ...range,
    assumptions: [
      `${roofSize} roof planning assumption using about ${area.toLocaleString()} roofing sq ft`,
      `${materialType.replace(/_/g, ' ')} roof priced with separate labor and material allowances`,
      tearOff === 'yes' ? 'Included full tear-off and disposal allowance' : 'Overlay/no tear-off assumption used',
      stories > 1 ? `${stories}-story access increased labor allowance` : 'Single-story access assumption used',
      complexity === 'high' ? 'High roof complexity increased waste/detail labor without inflating area size bucket' : `Roof complexity assumed ${complexity}`,
      difficultAccess ? 'Difficult access increased labor allowance' : 'Normal access assumed',
      getEstimateBreakdown(mid, laborShare),
    ],
    risk_notes: [
      'Decking replacement, flashing detail, ventilation upgrades, permit rules, and steep pitch can increase final cost',
      'Insurance scope, chimney/skylight work, and exact measurements should be confirmed onsite',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on likely roof size, selected roofing material, tear-off scope, roof complexity, access difficulty, and ZIP-based pricing.', analysis),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, laborShare),
  };
}

function estimateExteriorPaint(_scopeAnswers: ScopeAnswers, qualityTier: string, zip: string, analysis?: VisionAnalysis): EstimateResult | null {
  if (!analysis) return null;

  const stories = analysis.scope_signals.stories ?? 1;
  const visibleWindows = analysis.scope_signals.window_count_visible ?? 0;
  const complexity = analysis.scope_signals.paint_complexity ?? 'medium';
  const sizeProfiles: Record<string, { surfaceArea: number; lowStoriesAdj: number }> = {
    small: { surfaceArea: 1250, lowStoriesAdj: 0.96 },
    medium: { surfaceArea: 2100, lowStoriesAdj: 1.0 },
    large: { surfaceArea: 3200, lowStoriesAdj: 1.04 },
  };
  const qualityRates: Record<string, { labor: number; materials: number }> = {
    budget: { labor: 2.05, materials: 0.62 },
    mid: { labor: 2.45, materials: 0.88 },
    premium: { labor: 2.95, materials: 1.24 },
  };

  const sizeProfile = sizeProfiles[analysis.estimated_size_bucket] ?? sizeProfiles.medium;
  const rates = qualityRates[qualityTier] ?? qualityRates.mid;
  let labor = sizeProfile.surfaceArea * rates.labor;
  let materials = sizeProfile.surfaceArea * rates.materials;

  if (stories === 2) labor *= 1.14;
  if (stories >= 3) labor *= 1.24;
  if (complexity === 'high') {
    labor *= 1.15;
    materials *= 1.06;
  } else if (complexity === 'low') {
    labor *= sizeProfile.lowStoriesAdj;
  }

  if (visibleWindows >= 12) labor *= 1.12;
  else if (visibleWindows >= 7) labor *= 1.06;
  else if (visibleWindows <= 2) labor *= 0.97;

  const zipMultiplier = getZipMultiplier(zip);
  const mid = (labor + materials) * zipMultiplier;
  const spread = complexity === 'high' || stories >= 3 ? 0.18 : 0.15;
  const range = buildRange(mid, spread);
  const laborShare = labor / Math.max(labor + materials, 1);

  return {
    ...range,
    assumptions: [
      `${analysis.estimated_size_bucket} exterior size bucket using about ${sizeProfile.surfaceArea.toLocaleString()} paintable sq ft of siding/trim surfaces`,
      stories ? `${stories}-story access assumption applied` : 'Story count not confidently visible',
      visibleWindows >= 7 ? `Visible window count (${visibleWindows}) increased masking and cut-in labor` : `Visible window count (${visibleWindows || 0}) used to adjust masking labor`,
      complexity ? `${complexity} paint complexity signal used for trim/detail labor` : 'Standard exterior paint complexity assumed',
      getEstimateBreakdown(mid, laborShare),
    ],
    risk_notes: [
      'Scraping, peeling remediation, carpentry repairs, lead-safe prep, and lift/scaffold needs can materially increase cost',
      'Exact elevations, trim detail, shutters, detached structures, and paint condition should be confirmed onsite',
    ],
    estimate_basis: withAnalysisBasis('Planning estimate based on exterior surface size bucket, story count, visible window count, paint-detail complexity, finish tier, and ZIP-based pricing.', analysis, 4),
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, laborShare),
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
    return {
      ...mapped,
      assumptions: [
        `Custom project scope was inferred most closely as ${mappedCategory.replace(/_/g, ' ')} from uploaded photo analysis and homeowner notes`,
        ...mapped.assumptions,
        'Estimate remains planning-grade until exact onsite scope and quantities are confirmed',
      ],
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
  const range = buildRange(mid, 0.22);

  return {
    ...range,
    assumptions: [
      'This is a mixed-scope planning estimate for a custom project',
      'Estimate is based on uploaded photo analysis and homeowner description',
      `${sizeBucket} size bucket and ${complexity} complexity assumptions were used`,
      getEstimateBreakdown(mid, 0.68),
      'Exact pricing depends on onsite scope definition and verified quantities',
    ],
    risk_notes: [
      'Custom-project scope gaps, trade overlap, and hidden conditions can move pricing materially',
      'A contractor site visit is needed to narrow demolition, framing, finish, and permit assumptions',
    ],
    estimate_basis: trade && trade !== 'unknown'
      ? `Custom project estimate based on mixed-scope remodel assumptions with an explicitly inferred ${trade.replace(/_/g, ' ')} trade from uploaded image analysis.`
      : 'Custom project estimate based on mixed-scope remodel assumptions from uploaded image analysis.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
    estimate_breakdown: getEstimateBreakdown(mid, 0.68),
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
    roofing: 0.58,
    exterior_paint: 0.74,
    deck_patio: 0.63,
    landscaping: 0.6,
    kitchen: 0.56,
    bathroom: 0.6,
    flooring: 0.55,
    interior_paint: 0.76,
    custom_project: 0.68,
  };
  const breakdown = getEstimateBreakdown(mid, laborShareByCategory[category] ?? 0.62);

  return {
    ...range,
    assumptions: [
      `${qualityTier} quality finishes and materials`,
      `Typical labor rates for ZIP ${zip}`,
      `Standard scope for a ${category.replace(/_/g, ' ')} project`,
      notes ? 'Included homeowner notes in planning assumptions' : 'No unusual site constraints assumed',
      breakdown,
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

  if ((!scopeAnswers || Object.keys(scopeAnswers).length === 0) && !analysis) return null;

  const estimators: Record<string, (answers: ScopeAnswers, tier: string, zipCode: string, analysis?: VisionAnalysis) => EstimateResult | null> = {
    interior_paint: estimateInteriorPaint,
    flooring: estimateFlooring,
    bathroom: (answers, tier, zipCode) => estimateBathroom(answers, tier, zipCode),
    kitchen: (answers, tier, zipCode) => estimateKitchen(answers, tier, zipCode),
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
        });
        result = await parseClaudeJSON<EstimateResult>(system, user);
      } catch (aiError) {
        console.error('estimate ai fallback:', aiError);
        result = fallbackEstimate(params.category, params.quality_tier, params.zip_code, params.notes);
      }
    }

    if (analysis) {
      result.estimate_basis = withAnalysisBasis(result.estimate_basis, analysis, 4);
    }

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
