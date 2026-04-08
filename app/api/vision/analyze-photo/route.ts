import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { FALLBACK_VISION_ANALYSIS, type VisionAnalysis } from '@/lib/visionAnalysis';

const schema = z.object({
  image_url: z.string().url(),
  category: z.string(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder' });

const SYSTEM_PROMPT = 'You are a construction scope analysis expert. Analyze home project photos conservatively and return structured JSON describing only visible or strongly implied property type, size clues, scope clues, estimating signals, and confidence. Do not hallucinate exact measurements. Output ONLY valid JSON.';

const USER_PROMPT_TEMPLATE = `Analyze this uploaded home project photo for construction estimating context.

Be conservative. Infer only bucketed approximations from the visible image and any homeowner notes.
Do NOT invent exact dimensions, square footage, or hidden conditions.
If you cannot tell, use null.
Return a short size_reasoning list that explains what visible clues made the space or scope seem smaller, standard, or larger.

Return exactly this JSON shape and nothing else:
{
  "property_type": "one_story_house" | "two_story_house" | "townhome" | "condo_interior" | "single_room_interior" | "open_plan_interior" | "unknown",
  "project_area": "front_exterior" | "backyard" | "roof" | "kitchen" | "bathroom" | "living_room" | "bedroom" | "other",
  "estimated_size_bucket": "small" | "medium" | "large",
  "visible_features": ["..."],
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
  "size_reasoning": ["..."],
  "estimation_notes": ["..."],
  "materials_signals": ["..."],
  "suggested_trade": "paint" | "flooring" | "roofing" | "deck" | "landscaping" | "bathroom" | "kitchen" | "mixed_finish" | "general_remodel" | "repair" | "unknown",
  "suggested_location_type": "interior" | "exterior" | "unknown",
  "complexity": "simple" | "moderate" | "complex"
}

Use null for unknown numeric or enum fields. Keep visible_features, size_reasoning, estimation_notes, and materials_signals concise and specific. When the category is custom_project, infer likely trade, whether the job appears interior or exterior, overall complexity, size bucket, and major visible elements from the photo and homeowner notes.`;

function sanitizeAnalysis(input: Partial<VisionAnalysis> | null | undefined): VisionAnalysis {
  const sizeReasoning = Array.isArray(input?.size_reasoning)
    ? input.size_reasoning.filter(Boolean).slice(0, 5)
    : typeof input?.size_reasoning === 'string'
      ? [input.size_reasoning].filter(Boolean).slice(0, 5)
      : [];

  return {
    ...FALLBACK_VISION_ANALYSIS,
    ...input,
    visible_features: Array.isArray(input?.visible_features) ? input.visible_features.filter(Boolean).slice(0, 12) : [],
    size_reasoning: sizeReasoning,
    estimation_notes: Array.isArray(input?.estimation_notes) ? input.estimation_notes.filter(Boolean).slice(0, 8) : FALLBACK_VISION_ANALYSIS.estimation_notes,
    materials_signals: Array.isArray(input?.materials_signals) ? input.materials_signals.filter(Boolean).slice(0, 8) : [],
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
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1600,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${USER_PROMPT_TEMPLATE}\n\nProject category: ${params.category}${params.zip_code ? `\nZIP code: ${params.zip_code}` : ''}${params.notes ? `\nHomeowner notes: ${params.notes}` : ''}`,
            },
            { type: 'image', source: { type: 'url', url: params.image_url } },
          ],
        }],
      });

      const text = response.content
        .filter((content): content is Extract<(typeof response.content)[number], { type: 'text' }> => content.type === 'text')
        .map((content) => content.text)
        .join('\n')
        .trim();

      const candidate = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
      const firstBrace = candidate.indexOf('{');
      const lastBrace = candidate.lastIndexOf('}');
      const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? candidate.slice(firstBrace, lastBrace + 1) : candidate;
      const analysis = sanitizeAnalysis(JSON.parse(jsonText) as VisionAnalysis);

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
