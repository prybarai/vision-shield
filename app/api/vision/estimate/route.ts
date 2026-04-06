import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildEstimationPrompt } from '@/lib/prompts';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  location_type: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  zip_code: z.string(),
  notes: z.string().optional(),
  scope_answers: z.record(z.string(), z.string()).optional(),
});

interface EstimateResult {
  low_estimate: number;
  mid_estimate: number;
  high_estimate: number;
  assumptions: string[];
  risk_notes: string[];
  estimate_basis: string;
  regional_notes?: string;
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

function estimateInteriorPaint(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string): EstimateResult | null {
  const roomSize = scopeAnswers.room_size;
  const paintScope = scopeAnswers.paint_scope;
  const prepLevel = scopeAnswers.prep_level;
  const windowCoverage = scopeAnswers.window_coverage;

  if (!roomSize || !paintScope || !prepLevel || !windowCoverage) return null;

  const floorAreaBySize: Record<string, number> = { small: 120, medium: 180, large: 300 };
  const wallAreaBySize: Record<string, number> = { small: 320, medium: 440, large: 650 };
  const scopeMultiplierByScope: Record<string, number> = {
    walls_only: 1,
    walls_and_ceiling: 1.25,
    walls_ceiling_trim: 1.45,
  };
  const prepMultiplierByLevel: Record<string, number> = { light: 1.0, medium: 1.2, heavy: 1.4 };
  const rateByQuality: Record<string, number> = { budget: 2.25, mid: 3.25, premium: 4.5 };

  const floorArea = floorAreaBySize[roomSize];
  const wallArea = wallAreaBySize[roomSize];
  const scopeMultiplier = scopeMultiplierByScope[paintScope];
  const prepMultiplier = prepMultiplierByLevel[prepLevel];
  const baseRate = rateByQuality[qualityTier];

  if (!floorArea || !wallArea || !scopeMultiplier || !prepMultiplier || !baseRate) return null;

  const paintableWallArea = windowCoverage === 'many_windows' ? wallArea * 0.8 : wallArea;
  const zipMultiplier = getZipMultiplier(zip);
  const rawMid = paintableWallArea * baseRate * scopeMultiplier * prepMultiplier * zipMultiplier;
  const minimumBySize: Record<string, number> = { small: 700, medium: 1000, large: 1500 };
  const mid = Math.max(rawMid, minimumBySize[roomSize] ?? 700);
  const range = buildRange(mid, 0.18);

  return {
    ...range,
    assumptions: [
      `${roomSize.replace(/_/g, ' ')} room using ~${floorArea} floor sq ft and ~${wallArea} wall sq ft assumptions`,
      windowCoverage === 'many_windows' ? 'Paintable wall area reduced by 20% for high window coverage' : 'Normal window coverage assumed',
      `${paintScope.replace(/_/g, ' ')} scope with ${prepLevel} prep`,
      `${qualityTier} paint/labor rate of about $${baseRate.toFixed(2)}/paintable sq ft before adjustments`,
    ],
    risk_notes: [
      'Wall repairs, stain blocking, lead-safe work, or furniture moving can raise final painter pricing',
      'Ceiling height, trim detail, and exact measured wall area may shift the contractor bid',
    ],
    estimate_basis: 'Scope-based planning estimate using room-size wall area assumptions, selected paint scope, prep level, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
  };
}

function estimateFlooring(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string): EstimateResult | null {
  const roomSize = scopeAnswers.room_size;
  const materialType = scopeAnswers.material_type;
  const demoRequired = scopeAnswers.demo_required;

  if (!roomSize || !materialType || !demoRequired) return null;

  const areaBySize: Record<string, number> = { small: 120, medium: 220, large: 400 };
  const pricingByMaterial: Record<string, Record<string, number>> = {
    lvp: { budget: 5.5, mid: 7, premium: 9 },
    laminate: { budget: 4.5, mid: 6, premium: 8 },
    engineered_hardwood: { budget: 8, mid: 11, premium: 15 },
    tile: { budget: 9, mid: 13, premium: 18 },
  };

  const area = areaBySize[roomSize];
  const rate = pricingByMaterial[materialType]?.[qualityTier];

  if (!area || !rate) return null;

  const demoRate = demoRequired === 'yes' ? 1.75 : 0;
  const zipMultiplier = getZipMultiplier(zip);
  const mid = (area * (rate + demoRate)) * zipMultiplier;
  const range = buildRange(mid, 0.15);

  return {
    ...range,
    assumptions: [
      `${roomSize.replace(/_/g, ' ')} room using ~${area} sq ft`,
      `${materialType.replace(/_/g, ' ')} installed at about $${rate.toFixed(2)}/sq ft for ${qualityTier} tier`,
      demoRequired === 'yes' ? 'Included demo/removal at about $1.75/sq ft' : 'No demolition/removal assumed',
    ],
    risk_notes: [
      'Subfloor leveling, transitions, stairs, and trim work can increase flooring bids',
      'Moisture issues or complex tile layout can push final pricing higher',
    ],
    estimate_basis: 'Scope-based planning estimate using assumed room square footage, selected flooring material, demo scope, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
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
    ],
    risk_notes: [
      'Plumbing relocation, waterproofing repairs, and permit/code updates can materially raise final cost',
      'Older bathrooms often uncover hidden substrate or water damage once opened up',
    ],
    estimate_basis: 'Scope-based planning estimate using bathroom remodel tier, size multiplier, finish level, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
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
    ],
    risk_notes: [
      'Cabinet layout changes, electrical upgrades, and appliance moves can increase final kitchen bids',
      'Countertop selection and custom storage details often change pricing late in planning',
    ],
    estimate_basis: 'Scope-based planning estimate using kitchen remodel tier, size multiplier, finish level, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
  };
}

function estimateDeck(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string): EstimateResult | null {
  const deckSize = scopeAnswers.deck_size;
  const materialType = scopeAnswers.material_type;
  const railing = scopeAnswers.railing;

  if (!deckSize || !materialType || !railing) return null;

  const areaBySize: Record<string, number> = { small: 120, medium: 240, large: 400 };
  const pricingByMaterial: Record<string, Record<string, number>> = {
    pressure_treated: { budget: 38, mid: 48, premium: 60 },
    composite: { budget: 52, mid: 68, premium: 85 },
    cedar_redwood: { budget: 48, mid: 62, premium: 78 },
  };
  const railingBySize: Record<string, number> = { small: 1800, medium: 2800, large: 4200 };

  const area = areaBySize[deckSize];
  const rate = pricingByMaterial[materialType]?.[qualityTier];

  if (!area || !rate) return null;

  const railingCost = railing === 'yes' ? railingBySize[deckSize] : 0;
  const zipMultiplier = getZipMultiplier(zip);
  const mid = ((area * rate) + railingCost) * zipMultiplier;
  const range = buildRange(mid, 0.17);

  return {
    ...range,
    assumptions: [
      `${deckSize} deck/patio using ~${area} sq ft`,
      `${materialType.replace(/_/g, ' ')} installed at about $${rate.toFixed(2)}/sq ft for ${qualityTier} tier`,
      railing === 'yes' ? 'Included railing allowance based on selected size' : 'No railing allowance included',
    ],
    risk_notes: [
      'Footings, height off grade, stairs, and permits can increase deck pricing',
      'Difficult access or demo of an existing structure may raise the final contractor bid',
    ],
    estimate_basis: 'Scope-based planning estimate using assumed deck area, selected material, railing allowance, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
  };
}

function estimateRoofing(scopeAnswers: ScopeAnswers, qualityTier: string, zip: string): EstimateResult | null {
  const roofSize = scopeAnswers.roof_size;
  const materialType = scopeAnswers.material_type;
  const tearOff = scopeAnswers.tear_off;

  if (!roofSize || !materialType || !tearOff) return null;

  const areaBySize: Record<string, number> = { small: 1400, medium: 2200, large: 3200 };
  const pricingByMaterial: Record<string, Record<string, number>> = {
    asphalt: { budget: 4.75, mid: 6, premium: 7.5 },
    architectural_shingle: { budget: 5.5, mid: 7, premium: 9 },
    metal: { budget: 10, mid: 14, premium: 19 },
  };

  const area = areaBySize[roofSize];
  const rate = pricingByMaterial[materialType]?.[qualityTier];

  if (!area || !rate) return null;

  const tearOffRate = tearOff === 'yes' ? 1.25 : 0;
  const zipMultiplier = getZipMultiplier(zip);
  const mid = (area * (rate + tearOffRate)) * zipMultiplier;
  const range = buildRange(mid, 0.14);

  return {
    ...range,
    assumptions: [
      `${roofSize} roof using ~${area} roofing sq ft`,
      `${materialType.replace(/_/g, ' ')} installed at about $${rate.toFixed(2)}/sq ft for ${qualityTier} tier`,
      tearOff === 'yes' ? 'Included tear-off at about $1.25/sq ft' : 'Overlay/no tear-off assumed',
    ],
    risk_notes: [
      'Roof pitch, decking replacement, flashing detail, and ventilation upgrades can increase cost',
      'Insurance scope, permit requirements, and steep-access labor can shift final pricing',
    ],
    estimate_basis: 'Scope-based planning estimate using assumed roof area, selected material, tear-off scope, and ZIP multiplier.',
    regional_notes: getRegionalNotes(zip, zipMultiplier),
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
  };

  let mid = baseMid[category] ?? 15000;
  const zipMultiplier = getZipMultiplier(zip);

  if (qualityTier === 'budget') mid *= 0.75;
  if (qualityTier === 'premium') mid *= 1.45;
  mid *= zipMultiplier;

  const range = buildRange(mid, 0.22);

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
  };
}

function estimateDeterministically(category: string, scopeAnswers: ScopeAnswers | undefined, qualityTier: string, zip: string): EstimateResult | null {
  if (!scopeAnswers || Object.keys(scopeAnswers).length === 0) return null;

  const estimators: Record<string, (answers: ScopeAnswers, tier: string, zipCode: string) => EstimateResult | null> = {
    interior_paint: estimateInteriorPaint,
    flooring: estimateFlooring,
    bathroom: estimateBathroom,
    kitchen: estimateKitchen,
    deck_patio: estimateDeck,
    roofing: estimateRoofing,
  };

  const estimator = estimators[category];
  return estimator ? estimator(scopeAnswers, qualityTier, zip) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    let result = estimateDeterministically(params.category, params.scope_answers, params.quality_tier, params.zip_code);

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

    await supabaseAdmin.from('projects').update({ status: 'estimated' }).eq('id', params.project_id);

    return NextResponse.json({ estimate: { ...data, regional_notes: result.regional_notes } });
  } catch (error) {
    console.error('estimate error:', error);
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 });
  }
}
