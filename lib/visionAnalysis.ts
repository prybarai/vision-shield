export type VisionPropertyType =
  | 'one_story_house'
  | 'two_story_house'
  | 'townhome'
  | 'condo_interior'
  | 'single_room_interior'
  | 'open_plan_interior'
  | 'unknown';

export type VisionProjectArea =
  | 'front_exterior'
  | 'backyard'
  | 'roof'
  | 'kitchen'
  | 'bathroom'
  | 'living_room'
  | 'bedroom'
  | 'other';

export type VisionSizeBucket = 'small' | 'medium' | 'large';
export type VisionComplexity = 'low' | 'medium' | 'high';
export type VisionAccessDifficulty = 'easy' | 'moderate' | 'difficult';
export type VisionCeilingHeight = 'standard' | 'tall' | 'vaulted';
export type VisionSuggestedTrade = 'paint' | 'flooring' | 'roofing' | 'deck' | 'landscaping' | 'bathroom' | 'kitchen' | 'mixed_finish' | 'general_remodel' | 'repair' | 'unknown';
export type VisionSuggestedLocationType = 'interior' | 'exterior' | 'unknown';
export type VisionProjectComplexity = 'simple' | 'moderate' | 'complex';

export interface VisionAnalysis {
  property_type: VisionPropertyType;
  project_area: VisionProjectArea;
  estimated_size_bucket: VisionSizeBucket;
  visible_features: string[];
  scope_signals: {
    stories: 1 | 2 | 3 | null;
    window_count_visible: number | null;
    roof_complexity: VisionComplexity | null;
    paint_complexity: VisionComplexity | null;
    yard_size: VisionSizeBucket | null;
    room_size: VisionSizeBucket | null;
    ceiling_height: VisionCeilingHeight | null;
    access_difficulty: VisionAccessDifficulty | null;
  };
  estimation_notes: string[];
  materials_signals: string[];
  suggested_trade?: VisionSuggestedTrade;
  suggested_location_type?: VisionSuggestedLocationType;
  complexity?: VisionProjectComplexity;
}

export const FALLBACK_VISION_ANALYSIS: VisionAnalysis = {
  property_type: 'unknown',
  project_area: 'other',
  estimated_size_bucket: 'medium',
  visible_features: [],
  scope_signals: {
    stories: null,
    window_count_visible: null,
    roof_complexity: null,
    paint_complexity: null,
    yard_size: null,
    room_size: null,
    ceiling_height: null,
    access_difficulty: null,
  },
  estimation_notes: ['Photo analysis unavailable; continue with scope-based planning assumptions.'],
  materials_signals: [],
  suggested_trade: 'unknown',
  suggested_location_type: 'unknown',
  complexity: 'moderate',
};

function humanize(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ') : '';
}

export function buildAnalysisSummary(analysis?: VisionAnalysis | null): string | null {
  if (!analysis) return null;

  const parts: string[] = [];
  if (analysis.property_type !== 'unknown') parts.push(humanize(analysis.property_type));
  if (analysis.scope_signals.roof_complexity) parts.push(`${analysis.scope_signals.roof_complexity} roof complexity`);
  if (analysis.scope_signals.paint_complexity) parts.push(`${analysis.scope_signals.paint_complexity} paint complexity`);
  if (typeof analysis.scope_signals.window_count_visible === 'number') parts.push(`${analysis.scope_signals.window_count_visible} visible windows`);
  if (analysis.scope_signals.access_difficulty) parts.push(`${analysis.scope_signals.access_difficulty} access`);
  if (analysis.scope_signals.room_size) parts.push(`${analysis.scope_signals.room_size} room`);
  if (analysis.suggested_trade && analysis.suggested_trade !== 'unknown') parts.push(`${humanize(analysis.suggested_trade)} scope`);
  if (analysis.suggested_location_type && analysis.suggested_location_type !== 'unknown') parts.push(`${analysis.suggested_location_type} project`);
  if (analysis.complexity) parts.push(`${analysis.complexity} complexity`);
  if (parts.length === 0) return null;

  return `AI analysis: ${parts.slice(0, 4).join('; ')}`;
}

export function describeAnalysisFacts(analysis?: VisionAnalysis | null): string[] {
  if (!analysis) return [];

  const facts: string[] = [];
  if (analysis.property_type !== 'unknown') facts.push(humanize(analysis.property_type));
  if (analysis.project_area !== 'other') facts.push(humanize(analysis.project_area));
  if (analysis.scope_signals.stories) facts.push(`${analysis.scope_signals.stories}-story structure`);
  if (analysis.scope_signals.room_size) facts.push(`${analysis.scope_signals.room_size} room`);
  if (analysis.scope_signals.roof_complexity) facts.push(`${analysis.scope_signals.roof_complexity} roof complexity`);
  if (analysis.scope_signals.paint_complexity) facts.push(`${analysis.scope_signals.paint_complexity} paint complexity`);
  if (analysis.scope_signals.access_difficulty) facts.push(`${analysis.scope_signals.access_difficulty} access`);
  if (typeof analysis.scope_signals.window_count_visible === 'number') facts.push(`${analysis.scope_signals.window_count_visible} visible windows`);
  if (analysis.suggested_trade && analysis.suggested_trade !== 'unknown') facts.push(`${humanize(analysis.suggested_trade)} scope`);
  if (analysis.suggested_location_type && analysis.suggested_location_type !== 'unknown') facts.push(`${analysis.suggested_location_type} project`);
  if (analysis.complexity) facts.push(`${analysis.complexity} complexity`);
  return facts;
}
