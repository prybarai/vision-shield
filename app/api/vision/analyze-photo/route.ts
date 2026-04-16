import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseOpenAIVisionJSONFromUrl } from '@/lib/openaiVision';
import { FALLBACK_VISION_ANALYSIS, type VisionAnalysis } from '@/lib/visionAnalysis';

const schema = z.object({
  image_url: z.string().url(),
  category: z.string(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
});

const SYSTEM_PROMPT = 'You are an expert home renovation consultant and construction estimator. Analyze the actual uploaded photo together with the homeowner request. Be observant, conservative, and useful. Do not hallucinate hidden conditions or exact dimensions. Return only valid JSON.';

const USER_PROMPT_TEMPLATE = `Analyze the uploaded home project photo together with the homeowner request.

Return one JSON object with exactly these fields:
{
  "space_type": string | null,
  "estimated_sqft": string | null,
  "current_materials": string[],
  "current_condition": "good" | "dated" | "poor" | "damaged" | "mixed" | "unknown",
  "architectural_features": string[],
  "existing_style": string | null,
  "renovation_scope": string | null,
  "key_challenges": string[],
  "photo_observations": string | null,
  "customization_notes": string | null,
  "homeowner_goal": string | null,
  "visible_constraints": string[],
  "loading_observations": string[],
  "property_type": "one_story_house" | "two_story_house" | "townhome" | "condo_interior" | "single_room_interior" | "open_plan_interior" | "unknown",
  "project_area": "front_exterior" | "backyard" | "roof" | "kitchen" | "bathroom" | "living_room" | "bedroom" | "other",
  "estimated_size_bucket": "small" | "medium" | "large",
  "visible_features": string[],
  "scope_signals": {
    "stories": 1 | 2 | 3 | null,
    "window_count_visible": number | null,
    "roof_complexity": "low" | "medium" | "high" | null,
    "paint_complexity": "low" | "medium" | "high" | null,
    "yard_size": "small" | "medium" | "large" | null,
    "room_size": "small" | "medium" | "large" | null,
    "ceiling_height": "standard" | "tall" | "vaulted" | null,
    "access_difficulty": "easy" | "moderate" | "difficult" | null
  },
  "estimated_dimensions": {
    "width_bucket": "narrow" | "standard" | "wide" | null,
    "depth_bucket": "shallow" | "standard" | "deep" | null
  },
  "area_signals": {
    "wall_area_bucket": "low" | "medium" | "high" | null,
    "floor_area_bucket": "low" | "medium" | "high" | null,
    "roof_area_bucket": "low" | "medium" | "high" | null,
    "yard_area_bucket": "low" | "medium" | "high" | null
  },
  "confidence": "low" | "medium" | "high" | null,
  "size_reasoning": string[],
  "estimation_notes": string[],
  "materials_signals": string[],
  "suggested_trade": "paint" | "flooring" | "roofing" | "deck" | "landscaping" | "bathroom" | "kitchen" | "mixed_finish" | "general_remodel" | "repair" | "unknown",
  "suggested_location_type": "interior" | "exterior" | "unknown",
  "complexity": "simple" | "moderate" | "complex"
}

Rules:
- Use the actual photo first, then use the homeowner notes to understand the desired change.
- Do not invent exact dimensions, exact square footage, or hidden conditions.
- estimated_sqft should be a short planning string like "small powder room", "roughly 180-240 sq ft", or "front elevation only".
- current_materials, architectural_features, key_challenges, visible_features, size_reasoning, estimation_notes, materials_signals, visible_constraints, and loading_observations must be concise and specific.
- loading_observations should be 3 to 5 short, user-facing lines that sound like live analysis updates.
- renovation_scope should explain what would need to change to achieve the homeowner goal in this exact visible space.
- customization_notes should connect the homeowner request to what is actually visible.
- If something is unknown, use null for nullable fields or an empty array.
- Output only valid JSON with no markdown.`;

function arrayOfStrings(value: unknown, limit: number) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, limit)
    : [];
}

function sanitizeAnalysis(input: Partial<VisionAnalysis> | null | undefined): VisionAnalysis {
  const sizeReasoning = Array.isArray(input?.size_reasoning)
    ? input.size_reasoning.filter(Boolean).slice(0, 5)
    : typeof input?.size_reasoning === 'string'
      ? [input.size_reasoning].filter(Boolean).slice(0, 5)
      : [];

  return {
    ...FALLBACK_VISION_ANALYSIS,
    ...input,
    space_type: typeof input?.space_type === 'string' ? input.space_type.trim() : null,
    estimated_sqft: typeof input?.estimated_sqft === 'string' ? input.estimated_sqft.trim() : null,
    current_materials: arrayOfStrings(input?.current_materials, 10),
    architectural_features: arrayOfStrings(input?.architectural_features, 10),
    renovation_scope: typeof input?.renovation_scope === 'string' ? input.renovation_scope.trim() : null,
    key_challenges: arrayOfStrings(input?.key_challenges, 8),
    photo_observations: typeof input?.photo_observations === 'string' ? input.photo_observations.trim() : null,
    customization_notes: typeof input?.customization_notes === 'string' ? input.customization_notes.trim() : null,
    homeowner_goal: typeof input?.homeowner_goal === 'string' ? input.homeowner_goal.trim() : null,
    visible_constraints: arrayOfStrings(input?.visible_constraints, 6),
    loading_observations: arrayOfStrings(input?.loading_observations, 6),
    visible_features: arrayOfStrings(input?.visible_features, 12),
    size_reasoning: sizeReasoning,
    estimation_notes: arrayOfStrings(input?.estimation_notes, 8).length > 0
      ? arrayOfStrings(input?.estimation_notes, 8)
      : FALLBACK_VISION_ANALYSIS.estimation_notes,
    materials_signals: arrayOfStrings(input?.materials_signals, 8),
    existing_style: typeof input?.existing_style === 'string' ? input.existing_style.trim() : null,
    current_condition: input?.current_condition || FALLBACK_VISION_ANALYSIS.current_condition,
    scope_signals: {
      ...FALLBACK_VISION_ANALYSIS.scope_signals,
      ...(input?.scope_signals || {}),
    },
    estimated_dimensions: {
      ...FALLBACK_VISION_ANALYSIS.estimated_dimensions,
      ...(input?.estimated_dimensions || {}),
    },
    area_signals: {
      ...FALLBACK_VISION_ANALYSIS.area_signals,
      ...(input?.area_signals || {}),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    try {
      const analysis = sanitizeAnalysis(await parseOpenAIVisionJSONFromUrl<VisionAnalysis>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `${USER_PROMPT_TEMPLATE}\n\nProject category: ${params.category}${params.zip_code ? `\nZIP code: ${params.zip_code}` : ''}${params.notes ? `\nHomeowner request: ${params.notes}` : '\nHomeowner request: none provided'}`,
        imageUrl: params.image_url,
        maxTokens: 1200,
      }));

      return NextResponse.json({ analysis });
    } catch (visionError) {
      console.error('analyze-photo fallback:', visionError);
      return NextResponse.json({ analysis: FALLBACK_VISION_ANALYSIS });
    }
  } catch (error) {
    console.error('analyze-photo error:', error);
    return NextResponse.json({ analysis: FALLBACK_VISION_ANALYSIS });
  }
}
