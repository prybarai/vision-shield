import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.enum(['budget', 'mid', 'premium']),
  estimate_mid: z.number(),
  generated_image_url: z.string().optional(), // URL of AI-generated concept
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    // If we have a generated image, use Claude vision to describe what's in it
    let visualDescription = '';
    if (params.generated_image_url && !params.generated_image_url.startsWith('data:')) {
      try {
        const visionResponse = await anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: params.generated_image_url },
              },
              {
                type: 'text',
                text: `This is an AI-generated design concept for a ${params.category} renovation. Describe specifically: what materials are visible (flooring type, cabinet finish, countertop material, tile style, paint colors, hardware, fixtures, etc.). Be specific about colors, finishes, and styles you can see. Keep it to 3-4 sentences.`,
              },
            ],
          }],
        });
        const content = visionResponse.content[0];
        if (content.type === 'text') {
          visualDescription = content.text;
        }
      } catch (e) {
        console.error('Vision analysis failed:', e);
        // Continue without visual description
      }
    }

    const prompt = `Generate a detailed, accurate materials list for a ${params.quality_tier}-tier ${params.category} renovation in ${params.style} style with an estimated budget of $${params.estimate_mid.toLocaleString()}.

${visualDescription ? `The AI-generated design concept shows: ${visualDescription}

The materials list MUST match what is visible in that design concept.` : ''}

Output ONLY valid JSON:
{
  "line_items": [
    {
      "category": string,
      "item": string,
      "description": string,
      "quantity": number,
      "unit": string,
      "finish_tier": string,
      "estimated_cost_low": number,
      "estimated_cost_high": number,
      "sourcing_notes": string
    }
  ],
  "sourcing_notes": string
}

Include 10-15 specific line items. Be precise about materials — match the specific colors, finishes, and materials visible in the design. Group by category (e.g., "Cabinetry", "Countertops", "Tile & Flooring", "Fixtures", "Hardware", "Labor", "Permits & Fees").
Costs must add up to approximately $${Math.round(params.estimate_mid * 0.9).toLocaleString()}–$${Math.round(params.estimate_mid * 1.1).toLocaleString()}.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are a licensed general contractor and materials estimator. Output ONLY valid JSON with no markdown.',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response');

    const jsonStr = content.text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    const materials = JSON.parse(jsonStr) as { line_items: unknown[]; sourcing_notes: string };

    const { data, error } = await supabaseAdmin
      .from('material_lists')
      .insert({
        project_id: params.project_id,
        line_items: materials.line_items,
        sourcing_notes: materials.sourcing_notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ materials: data });
  } catch (error) {
    console.error('materials error:', error);
    return NextResponse.json({ error: 'Failed to generate materials list' }, { status: 500 });
  }
}
