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

const CATEGORY_PROMPTS: Record<string, string> = {
  roofing: 'architectural photograph of a beautiful home exterior with a newly installed {style} roof',
  exterior_paint: 'architectural photograph of a beautifully painted home exterior in {style} colors',
  deck_patio: 'beautiful backyard photograph with a newly constructed {style} wood deck and outdoor living space',
  landscaping: 'beautiful landscaped backyard with {style} garden design, manicured lawn, and thoughtful plantings',
  kitchen: 'interior design photograph of a beautiful {style} kitchen renovation with new cabinets and countertops',
  bathroom: 'interior design photograph of a beautifully renovated {style} bathroom with new tile and fixtures',
  flooring: 'interior design photograph of a room with beautiful new {style} flooring',
  interior_paint: 'interior design photograph of a room with fresh {style} paint colors and updated decor',
};

export function buildImagePrompt(category: string, style: string): string {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const basePrompt = (CATEGORY_PROMPTS[category] || 'beautiful {style} home improvement').replace('{style}', styleDesc);
  return `${basePrompt}, professional photography, high quality, realistic, 8k, architectural digest style, photorealistic`;
}

export async function generateConceptImages(params: {
  category: string;
  style: string;
  qualityTier: string;
  count?: number;
}): Promise<string[]> {
  const replicate = getClient();
  const count = params.count ?? 3;
  const basePrompt = buildImagePrompt(params.category, params.style);
  const variations = [
    basePrompt,
    `${basePrompt}, bright natural lighting, daytime`,
    `${basePrompt}, golden hour warm lighting`,
  ].slice(0, count);

  const results = await Promise.allSettled(
    variations.map(async (prompt) => {
      const output = await replicate.run('black-forest-labs/flux-schnell', {
        input: { prompt, num_outputs: 1, aspect_ratio: '4:3', output_format: 'webp', output_quality: 90 },
      }) as string[];
      return output[0];
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
    .map((r) => r.value);
}
