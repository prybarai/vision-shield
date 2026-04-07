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

const SYSTEM_PROMPT = 'You are a construction scope analysis expert. Analyze home project photos and return structured JSON describing visible property type, size clues, scope clues, and estimating signals. Output ONLY valid JSON.';

const USER_PROMPT_TEMPLATE = `Analyze this uploaded home project photo for construction estimating context.

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
  "estimation_notes": ["..."],
  "materials_signals": ["..."],
  "suggested_trade": "paint" | "flooring" | "roofing" | "deck" | "landscaping" | "bathroom" | "kitchen" | "mixed_finish" | "general_remodel" | "repair" | "unknown",
  "suggested_location_type": "interior" | "exterior" | "unknown",
  "complexity": "simple" | "moderate" | "complex"
}

Use null for unknown numeric or enum fields. Keep visible_features, estimation_notes, and materials_signals concise and specific. When the category is custom_project, infer likely trade, whether the job appears interior or exterior, overall complexity, size bucket, and major visible elements from the photo and homeowner notes.`;

function sanitizeAnalysis(input: Partial<VisionAnalysis> | null | undefined): VisionAnalysis {
  return {
    ...FALLBACK_VISION_ANALYSIS,
    ...input,
    visible_features: Array.isArray(input?.visible_features) ? input.visible_features.filter(Boolean).slice(0, 12) : [],
    estimation_notes: Array.isArray(input?.estimation_notes) ? input.estimation_notes.filter(Boolean).slice(0, 8) : FALLBACK_VISION_ANALYSIS.estimation_notes,
    materials_signals: Array.isArray(input?.materials_signals) ? input.materials_signals.filter(Boolean).slice(0, 8) : [],
    scope_signals: {
      ...FALLBACK_VISION_ANALYSIS.scope_signals,
      ...(input?.scope_signals || {}),
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
        max_tokens: 1400,
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
