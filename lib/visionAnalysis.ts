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
export type VisionDimensionBucket = 'narrow' | 'standard' | 'wide';
export type VisionDepthBucket = 'shallow' | 'standard' | 'deep';
export type VisionAreaSignalBucket = 'low' | 'medium' | 'high';
export type VisionConfidence = 'low' | 'medium' | 'high';
export type VisionCurrentCondition = 'good' | 'dated' | 'poor' | 'damaged' | 'mixed' | 'unknown';

export interface VisionAnalysis {
  space_type?: string | null;
  estimated_sqft?: string | null;
  current_materials: string[];
  current_condition?: VisionCurrentCondition | null;
  architectural_features: string[];
  existing_style?: string | null;
  renovation_scope?: string | null;
  key_challenges: string[];
  photo_observations?: string | null;
  customization_notes?: string | null;
  homeowner_goal?: string | null;
  visible_constraints?: string[];
  loading_observations?: string[];
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
  estimated_dimensions: {
    width_bucket: VisionDimensionBucket | null;
    depth_bucket: VisionDepthBucket | null;
  };
  area_signals: {
    wall_area_bucket: VisionAreaSignalBucket | null;
    floor_area_bucket: VisionAreaSignalBucket | null;
    roof_area_bucket: VisionAreaSignalBucket | null;
    yard_area_bucket: VisionAreaSignalBucket | null;
  };
  confidence: VisionConfidence | null;
  size_reasoning: string[];
  estimation_notes: string[];
  materials_signals: string[];
  suggested_trade?: VisionSuggestedTrade;
  suggested_location_type?: VisionSuggestedLocationType;
  complexity?: VisionProjectComplexity;
}

export const FALLBACK_VISION_ANALYSIS: VisionAnalysis = {
  space_type: null,
  estimated_sqft: null,
  current_materials: [],
  current_condition: 'unknown',
  architectural_features: [],
  existing_style: null,
  renovation_scope: null,
  key_challenges: [],
  photo_observations: null,
  customization_notes: null,
  homeowner_goal: null,
  visible_constraints: [],
  loading_observations: [],
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
  estimated_dimensions: {
    width_bucket: null,
    depth_bucket: null,
  },
  area_signals: {
    wall_area_bucket: null,
    floor_area_bucket: null,
    roof_area_bucket: null,
    yard_area_bucket: null,
  },
  confidence: null,
  size_reasoning: [],
  estimation_notes: ['Photo analysis unavailable; continue with scope-based planning assumptions.'],
  materials_signals: [],
  suggested_trade: 'unknown',
  suggested_location_type: 'unknown',
  complexity: 'moderate',
};

function humanize(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ') : '';
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0 && value.trim().toLowerCase() !== 'unknown');
}

export function buildAnalysisSummary(analysis?: VisionAnalysis | null): string | null {
  if (!analysis) return null;

  const parts: string[] = [];
  if (hasText(analysis.space_type)) parts.push(humanize(analysis.space_type));
  if (hasText(analysis.current_condition) && analysis.current_condition !== 'unknown') parts.push(`${humanize(analysis.current_condition)} condition`);
  if (hasText(analysis.estimated_sqft)) parts.push(`${analysis.estimated_sqft} footprint`);
  if (hasText(analysis.existing_style)) parts.push(`${analysis.existing_style} style`);
  if (analysis.property_type !== 'unknown') parts.push(humanize(analysis.property_type));
  if (analysis.scope_signals.roof_complexity) parts.push(`${analysis.scope_signals.roof_complexity} roof complexity`);
  if (analysis.scope_signals.paint_complexity) parts.push(`${analysis.scope_signals.paint_complexity} paint complexity`);
  if (analysis.area_signals.wall_area_bucket) parts.push(`${analysis.area_signals.wall_area_bucket} visible wall area`);
  if (analysis.area_signals.floor_area_bucket) parts.push(`${analysis.area_signals.floor_area_bucket} visible floor area`);
  if (analysis.area_signals.roof_area_bucket) parts.push(`${analysis.area_signals.roof_area_bucket} visible roof area`);
  if (typeof analysis.scope_signals.window_count_visible === 'number') parts.push(`${analysis.scope_signals.window_count_visible} visible windows`);
  if (analysis.scope_signals.access_difficulty) parts.push(`${analysis.scope_signals.access_difficulty} access`);
  if (analysis.suggested_trade && analysis.suggested_trade !== 'unknown') parts.push(`${humanize(analysis.suggested_trade)} scope`);
  if (analysis.complexity) parts.push(`${analysis.complexity} complexity`);
  if (parts.length === 0) return null;

  return `AI analysis: ${parts.slice(0, 5).join('; ')}`;
}

export function describeAnalysisFacts(analysis?: VisionAnalysis | null): string[] {
  if (!analysis) return [];

  const facts: string[] = [];
  if (hasText(analysis.space_type)) facts.push(humanize(analysis.space_type));
  if (hasText(analysis.estimated_sqft)) facts.push(`${analysis.estimated_sqft} estimated scope`);
  if (hasText(analysis.current_condition) && analysis.current_condition !== 'unknown') facts.push(`${humanize(analysis.current_condition)} condition`);
  if (hasText(analysis.existing_style)) facts.push(`${analysis.existing_style} existing style`);
  if (analysis.current_materials.length) facts.push(`visible materials like ${analysis.current_materials.slice(0, 3).join(', ')}`);
  if (analysis.property_type !== 'unknown') facts.push(humanize(analysis.property_type));
  if (analysis.project_area !== 'other') facts.push(humanize(analysis.project_area));
  if (analysis.scope_signals.stories) facts.push(`${analysis.scope_signals.stories}-story structure`);
  if (analysis.scope_signals.room_size) facts.push(`${analysis.scope_signals.room_size} room`);
  if (analysis.scope_signals.roof_complexity) facts.push(`${analysis.scope_signals.roof_complexity} roof complexity`);
  if (analysis.scope_signals.paint_complexity) facts.push(`${analysis.scope_signals.paint_complexity} paint complexity`);
  if (analysis.scope_signals.access_difficulty) facts.push(`${analysis.scope_signals.access_difficulty} access`);
  if (analysis.area_signals.wall_area_bucket) facts.push(`${analysis.area_signals.wall_area_bucket} wall area signal`);
  if (analysis.area_signals.floor_area_bucket) facts.push(`${analysis.area_signals.floor_area_bucket} floor area signal`);
  if (analysis.area_signals.roof_area_bucket) facts.push(`${analysis.area_signals.roof_area_bucket} roof area signal`);
  if (analysis.area_signals.yard_area_bucket) facts.push(`${analysis.area_signals.yard_area_bucket} yard area signal`);
  if (analysis.estimated_dimensions.width_bucket) facts.push(`${analysis.estimated_dimensions.width_bucket} width`);
  if (analysis.estimated_dimensions.depth_bucket) facts.push(`${analysis.estimated_dimensions.depth_bucket} depth`);
  if (typeof analysis.scope_signals.window_count_visible === 'number') facts.push(`${analysis.scope_signals.window_count_visible} visible windows`);
  if (analysis.confidence) facts.push(`${analysis.confidence} confidence`);
  if (analysis.suggested_trade && analysis.suggested_trade !== 'unknown') facts.push(`${humanize(analysis.suggested_trade)} scope`);
  if (analysis.suggested_location_type && analysis.suggested_location_type !== 'unknown') facts.push(`${analysis.suggested_location_type} project`);
  if (analysis.complexity) facts.push(`${analysis.complexity} complexity`);
  return facts;
}

export function buildLoadingObservations(analysis?: VisionAnalysis | null): string[] {
  if (!analysis) return [];

  const observations = Array.isArray(analysis.loading_observations)
    ? analysis.loading_observations.filter(Boolean)
    : [];

  if (observations.length > 0) {
    return observations.slice(0, 6);
  }

  const generated: string[] = [];

  if (hasText(analysis.space_type) && hasText(analysis.estimated_sqft)) {
    generated.push(`This looks like a ${analysis.space_type} with about ${analysis.estimated_sqft} of visible project scope.`);
  } else if (hasText(analysis.space_type)) {
    generated.push(`This looks like a ${analysis.space_type}.`);
  }

  if (analysis.current_materials.length > 0) {
    generated.push(`Visible materials include ${analysis.current_materials.slice(0, 3).join(', ')}.`);
  }

  if (hasText(analysis.current_condition) && analysis.current_condition !== 'unknown') {
    generated.push(`Current condition reads as ${humanize(analysis.current_condition)}.`);
  }

  if (hasText(analysis.existing_style)) {
    generated.push(`The existing style feels ${analysis.existing_style}.`);
  }

  if (hasText(analysis.renovation_scope)) {
    generated.push(`Planned scope: ${analysis.renovation_scope}`);
  }

  if (analysis.key_challenges.length > 0) {
    generated.push(`Key challenge to price around: ${analysis.key_challenges[0]}.`);
  }

  if (analysis.architectural_features.length > 0) {
    generated.push(`We’ll preserve ${analysis.architectural_features.slice(0, 2).join(' and ')}.`);
  }

  if (hasText(analysis.photo_observations)) {
    generated.push(analysis.photo_observations!.trim());
  }

  return generated.slice(0, 6);
}
