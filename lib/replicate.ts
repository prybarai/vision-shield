import Replicate from 'replicate';

function getClient() {
  return new Replicate({ auth: process.env.REPLICATE_API_TOKEN || 'placeholder' });
}

const INTERIOR_CATEGORIES = new Set(['kitchen', 'bathroom', 'flooring', 'interior_paint']);

// Interior design instructions (for adirik/interior-design model)
const INTERIOR_INSTRUCTIONS: Record<string, string> = {
  kitchen: 'renovate the kitchen with new {style} cabinets, countertops, and modern appliances, keeping the same room layout and dimensions',
  bathroom: 'renovate the bathroom with {style} tile, a new vanity, and updated fixtures, keeping the same room layout',
  flooring: 'replace the flooring with beautiful new {style} flooring throughout the room, keeping all furniture and walls',
  interior_paint: 'repaint the walls in fresh {style} colors with updated trim, keeping all furniture and fixtures',
};

// Exterior transformation prompts for flux-dev img2img
const EXTERIOR_PROMPTS: Record<string, string> = {
  roofing: 'the same house with a beautiful new {style} roof installed, same house structure and surroundings',
  exterior_paint: 'the same house repainted in {style} exterior colors, same structure and landscaping',
  deck_patio: 'the same backyard with a beautiful new {style} deck and outdoor living area added, same house and yard',
  landscaping: 'the same yard with {style} professional landscaping, garden beds, and manicured lawn, same house',
};

// Prompt strength per exterior category — lower = more original preserved
const PROMPT_STRENGTH: Record<string, number> = {
  roofing: 0.55,
  exterior_paint: 0.50,
  deck_patio: 0.45,
  landscaping: 0.45,
};

const STYLE_DESCRIPTORS: Record<string, string> = {
  modern: 'modern, clean lines, contemporary',
  traditional: 'traditional, classic, timeless',
  minimal: 'minimalist, simple, neutral',
  luxury: 'luxury, high-end, premium',
  warm_natural: 'warm natural wood tones, organic',
  budget_refresh: 'clean, refreshed, practical',
};

// Text-to-image prompts for when no reference photo exists
const TEXT_TO_IMAGE_PROMPTS: Record<string, string> = {
  roofing: 'beautiful suburban home exterior with a new {style} architectural shingle roof, professional real estate photography, photorealistic',
  exterior_paint: 'beautiful home exterior freshly painted in {style} colors, curb appeal, professional real estate photography, photorealistic',
  deck_patio: 'beautiful backyard with a new {style} wood deck and outdoor seating area, professional real estate photography, photorealistic',
  landscaping: 'beautiful backyard with {style} professional landscaping, manicured lawn and garden beds, professional photography, photorealistic',
  kitchen: 'beautiful {style} kitchen renovation with new cabinets and countertops, interior design photography, photorealistic',
  bathroom: 'beautiful {style} bathroom renovation with new tile and vanity, interior design photography, photorealistic',
  flooring: 'beautiful room with new {style} hardwood flooring, interior design photography, photorealistic',
  interior_paint: 'beautiful room with fresh {style} paint and updated trim, interior design photography, photorealistic',
};

function extractUrl(item: unknown): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item.startsWith('http') ? item : null;
  // Replicate FileOutput object — String() returns the URL
  const str = String(item);
  return str.startsWith('http') ? str : null;
}

async function generateInteriorConcept(
  replicate: Replicate,
  referenceImageUrl: string,
  category: string,
  style: string,
  notes?: string
): Promise<string | null> {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const instruction = (INTERIOR_INSTRUCTIONS[category] || 'renovate the room with {style} finishes')
    .replace('{style}', styleDesc);
  const prompt = notes ? `${instruction}, ${notes}` : instruction;

  try {
    const output = await replicate.run('adirik/interior-design', {
      input: {
        image: referenceImageUrl,
        prompt,
        negative_prompt: 'lowres, watermark, banner, logo, text, deformed, blurry, blur, out of focus, surreal, ugly, unrealistic',
        num_inference_steps: 50,
        guidance_scale: 15,
        prompt_strength: 0.8,
        num_outputs: 1,
      },
    }) as unknown[];
    return extractUrl(output[0]);
  } catch (err) {
    console.error('Interior design model error:', err);
    return null;
  }
}

async function generateExteriorConcept(
  replicate: Replicate,
  referenceImageUrl: string,
  category: string,
  style: string,
  notes?: string
): Promise<string | null> {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const basePrompt = (EXTERIOR_PROMPTS[category] || 'the same property renovated with {style} finishes')
    .replace('{style}', styleDesc);
  const prompt = notes
    ? `${basePrompt}, ${notes}, photorealistic, professional photography`
    : `${basePrompt}, photorealistic, professional photography`;
  const promptStrength = PROMPT_STRENGTH[category] ?? 0.50;

  try {
    const output = await replicate.run('black-forest-labs/flux-dev', {
      input: {
        prompt,
        image: referenceImageUrl,
        prompt_strength: promptStrength,
        num_outputs: 1,
        aspect_ratio: '4:3',
        output_format: 'webp',
        output_quality: 90,
        num_inference_steps: 28,
        guidance: 3.5,
      },
    }) as unknown[];
    return extractUrl(output[0]);
  } catch (err) {
    console.error('Exterior concept error:', err);
    return null;
  }
}

async function generateTextToImageConcept(
  replicate: Replicate,
  category: string,
  style: string,
  notes?: string
): Promise<string | null> {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const basePrompt = (TEXT_TO_IMAGE_PROMPTS[category] || 'beautiful {style} home renovation')
    .replace('{style}', styleDesc);
  const prompt = notes ? `${basePrompt}, ${notes}` : basePrompt;

  try {
    const output = await replicate.run('black-forest-labs/flux-dev', {
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
    return extractUrl(output[0]);
  } catch (err) {
    console.error('Text-to-image error:', err);
    return null;
  }
}

export async function generateConceptImages(params: {
  category: string;
  style: string;
  qualityTier: string;
  notes?: string;
  referenceImageUrl?: string;
  count?: number;
}): Promise<string[]> {
  const replicate = getClient();
  const isInterior = INTERIOR_CATEGORIES.has(params.category);
  const count = params.count ?? 3;

  if (!params.referenceImageUrl) {
    // No photo — generate 1 generic concept with a clear disclaimer
    console.log('No reference image — generating generic concept');
    const url = await generateTextToImageConcept(replicate, params.category, params.style, params.notes);
    return url ? [url] : [];
  }

  if (isInterior) {
    // Interior: use the specialized interior design model
    // Generate count variations with slight prompt differences
    const styleVariations = [
      params.notes,
      params.notes ? `${params.notes}, bright natural lighting` : 'bright natural lighting, airy feel',
      params.notes ? `${params.notes}, warm ambient lighting` : 'warm ambient lighting, cozy atmosphere',
    ].slice(0, count);

    const results: string[] = [];
    for (const variation of styleVariations) {
      const url = await generateInteriorConcept(
        replicate,
        params.referenceImageUrl,
        params.category,
        params.style,
        variation
      );
      if (url) results.push(url);
    }
    return results;
  } else {
    // Exterior: use flux-dev img2img with low prompt_strength
    const lightingVariations = [
      '',
      'daytime natural lighting',
      'golden hour warm lighting',
    ].slice(0, count);

    const results: string[] = [];
    for (const lighting of lightingVariations) {
      const notesWithLighting = [params.notes, lighting].filter(Boolean).join(', ');
      const url = await generateExteriorConcept(
        replicate,
        params.referenceImageUrl,
        params.category,
        params.style,
        notesWithLighting || undefined
      );
      if (url) results.push(url);
    }
    return results;
  }
}
