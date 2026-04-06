import Replicate from 'replicate';

function getClient() {
  return new Replicate({ auth: process.env.REPLICATE_API_TOKEN || 'placeholder' });
}

const STYLE_DESCRIPTORS: Record<string, string> = {
  modern: 'modern, clean lines, contemporary materials, minimalist aesthetic',
  traditional: 'traditional, classic craftsmanship, timeless design, warm tones',
  minimal: 'minimalist, simple, uncluttered, neutral palette',
  luxury: 'luxury, high-end materials, premium finishes, elegant details',
  warm_natural: 'warm, natural materials, wood tones, organic textures, cozy',
  budget_refresh: 'clean, refreshed, practical, cost-effective updates',
};

// Category-specific transformation instructions
// Written as "what to change" — the model preserves everything else
const CATEGORY_TRANSFORMS: Record<string, string> = {
  roofing: 'replace the roof with a beautiful new {style} roof, same house structure',
  exterior_paint: 'repaint the exterior of the house in {style} colors, same house structure',
  deck_patio: 'add a beautiful new {style} deck and outdoor living space to the backyard',
  landscaping: 'transform the yard with {style} landscaping, garden beds, and manicured lawn',
  kitchen: 'renovate the kitchen with {style} cabinets, countertops, and fixtures, same room layout',
  bathroom: 'renovate the bathroom with {style} tile, vanity, and fixtures, same room layout',
  flooring: 'replace the flooring with beautiful new {style} flooring, same room',
  interior_paint: 'repaint the walls in fresh {style} colors, same room and furniture',
};

export function buildImagePrompt(category: string, style: string, notes?: string): string {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const transform = (CATEGORY_TRANSFORMS[category] || 'renovate with {style} finishes')
    .replace('{style}', styleDesc);
  const notesClause = notes ? `, ${notes}` : '';
  return `${transform}${notesClause}, professional architectural photography, photorealistic, high quality, 8k`;
}

function extractUrl(item: unknown): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item.startsWith('http') ? item : null;
  // Replicate FileOutput object — String() returns the URL
  const str = String(item);
  return str.startsWith('http') ? str : null;
}

export async function generateConceptImages(params: {
  category: string;
  style: string;
  qualityTier: string;
  notes?: string;
  referenceImageUrl?: string; // User's uploaded photo — enables img2img
  count?: number;
}): Promise<string[]> {
  const replicate = getClient();
  const count = params.count ?? 3;
  const basePrompt = buildImagePrompt(params.category, params.style, params.notes);

  // Slight prompt variations for each concept
  const promptVariations = [
    basePrompt,
    `${basePrompt}, daytime natural lighting`,
    `${basePrompt}, golden hour warm lighting`,
  ].slice(0, count);

  const results: Array<{ status: 'fulfilled'; value: string } | { status: 'rejected'; reason: unknown }> = [];

  for (const prompt of promptVariations) {
    try {
      let output: unknown[];

      if (params.referenceImageUrl) {
        // IMG2IMG MODE: Transform the user's actual photo
        // flux-dev with image_prompt keeps the real property structure intact
        // prompt_strength 0.65 = preserve ~35% of original, transform ~65%
        output = await replicate.run('black-forest-labs/flux-dev', {
          input: {
            prompt,
            image: params.referenceImageUrl,
            prompt_strength: 0.70,   // Higher = more transformation, lower = closer to original
            num_outputs: 1,
            aspect_ratio: '4:3',
            output_format: 'webp',
            output_quality: 90,
            num_inference_steps: 28,
            guidance: 3.5,
          },
        }) as unknown[];
      } else {
        // TEXT-TO-IMAGE fallback (no photo uploaded — address entry mode)
        output = await replicate.run('black-forest-labs/flux-dev', {
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '4:3',
            output_format: 'webp',
            output_quality: 90,
            num_inference_steps: 28,
            guidance: 3.5,
          },
        }) as unknown[];
      }

      const url = extractUrl(output[0]);
      if (url) {
        results.push({ status: 'fulfilled', value: url });
      } else {
        results.push({ status: 'rejected', reason: 'No URL returned' });
      }
    } catch (err) {
      console.error('Image generation error:', err);
      results.push({ status: 'rejected', reason: err });
    }
  }

  return results
    .filter((r): r is { status: 'fulfilled'; value: string } => r.status === 'fulfilled')
    .map((r) => r.value);
}
