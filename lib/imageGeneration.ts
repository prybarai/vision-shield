/**
 * Image generation using OpenAI gpt-image-1
 *
 * Strategy:
 * - WITH reference photo: use image editing (inpainting) to transform
 *   the actual property while preserving structure
 * - WITHOUT reference photo: use image generation with a highly detailed prompt
 *
 * gpt-image-1 is significantly better than flux at:
 * 1. Following detailed instructions precisely
 * 2. Preserving structural elements in edit mode
 * 3. Photorealistic output that looks like real construction
 */

import OpenAI, { toFile } from 'openai';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

const INTERIOR_CATEGORIES = new Set(['kitchen', 'bathroom', 'flooring', 'interior_paint']);

const STYLE_DESCRIPTORS: Record<string, string> = {
  modern: 'modern style with clean lines, flat-panel cabinets, quartz surfaces, and matte black or brushed nickel hardware',
  traditional: 'traditional style with raised-panel cabinetry, warm wood tones, crown molding, and oil-rubbed bronze fixtures',
  minimal: 'minimalist style with handle-less cabinetry, monochromatic palette, hidden storage, and clean uncluttered surfaces',
  luxury: 'luxury style with custom cabinetry, marble or quartzite surfaces, statement lighting, and designer fixtures',
  warm_natural: 'warm natural style with wood-tone finishes, organic textures, terracotta or sage accents, and warm brass hardware',
  budget_refresh: 'budget-friendly refresh with painted cabinets, laminate countertops, updated hardware, and fresh paint',
};

// Highly specific edit instructions per category
// These are crafted to produce accurate, contractor-realistic results
const EDIT_INSTRUCTIONS: Record<string, string> = {
  // INTERIOR
  kitchen: 'Renovate this kitchen. Replace the cabinets, countertops, and backsplash with {style}. Keep the exact same room dimensions, window positions, ceiling height, and appliance locations. The result should look like a real contractor renovation photo.',
  bathroom: 'Renovate this bathroom. Replace the tile, vanity, toilet, and fixtures with {style}. Keep the exact room dimensions, window positions, and plumbing locations. The result should look like a real contractor renovation photo.',
  flooring: 'Replace only the flooring in this room with {style} hardwood flooring. Keep all furniture, walls, windows, trim, and ceiling completely unchanged. The result should look like a professional flooring installation photo.',
  interior_paint: 'Repaint only the walls and trim in this room with {style} colors. Keep all furniture, flooring, windows, and fixtures completely unchanged. The result should look like a professional interior painting job.',

  // EXTERIOR
  roofing: 'Replace only the roof on this house with a new {style} architectural shingle roof. Keep the house structure, siding, windows, doors, landscaping, and surroundings completely unchanged. The result should look like a real roofing contractor before/after photo.',
  exterior_paint: 'Repaint only the exterior siding and trim of this house with {style} colors. Keep the roof, windows, doors, landscaping, driveway, and surroundings completely unchanged. The result should look like a professional exterior painting job.',
  deck_patio: 'Add a new {style} wood deck or patio to this backyard. Keep the house structure, fence, existing trees, and surroundings intact. Only add the deck/patio structure. The result should look like a real contractor installation photo.',
  landscaping: 'Professionally landscape this yard with {style} garden design including manicured lawn, garden beds, and appropriate plantings. Keep the house, fence, driveway, and hardscape completely unchanged. The result should look like a professional landscaping project photo.',
};

// Text-to-image prompts when no reference photo is available
const TEXT_PROMPTS: Record<string, string> = {
  kitchen: 'Professional real estate photograph of a beautifully renovated {style} kitchen. High-end photography, photorealistic, no watermarks.',
  bathroom: 'Professional real estate photograph of a beautifully renovated {style} bathroom. High-end photography, photorealistic, no watermarks.',
  flooring: 'Professional interior design photograph of a bright living room with brand new {style} hardwood flooring. Photorealistic, no watermarks.',
  interior_paint: 'Professional interior design photograph of a bright living room freshly painted in {style} colors with updated trim. Photorealistic, no watermarks.',
  roofing: 'Professional real estate photograph of a beautiful suburban home with a brand new {style} roof. Photorealistic, no watermarks.',
  exterior_paint: 'Professional real estate photograph of a beautiful home freshly repainted in {style} colors with great curb appeal. Photorealistic, no watermarks.',
  deck_patio: 'Professional real estate photograph of a beautiful backyard with a brand new {style} wood deck and outdoor living area. Photorealistic, no watermarks.',
  landscaping: 'Professional real estate photograph of a home with beautifully {style} professional landscaping and manicured lawn. Photorealistic, no watermarks.',
};

function buildInstruction(category: string, style: string, notes?: string): string {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const template = EDIT_INSTRUCTIONS[category] || 'Renovate this property with {style} finishes. Keep structural elements intact.';
  const instruction = template.replace('{style}', styleDesc);
  return notes ? `${instruction} Additional requirements: ${notes}.` : instruction;
}

function buildTextPrompt(category: string, style: string, notes?: string): string {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const template = TEXT_PROMPTS[category] || 'Professional photograph of a {style} home renovation.';
  const prompt = template.replace('{style}', styleDesc);
  return notes ? `${prompt} ${notes}.` : prompt;
}

async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateWithEdit(
  client: OpenAI,
  referenceImageUrl: string,
  category: string,
  style: string,
  notes?: string
): Promise<string | null> {
  try {
    const instruction = buildInstruction(category, style, notes);
    console.log(`[OpenAI edit] category=${category} style=${style}`);
    console.log(`[OpenAI edit] instruction=${instruction.substring(0, 100)}...`);

    // Fetch the reference image
    const imageBuffer = await fetchImageAsBuffer(referenceImageUrl);
    const imageFile = await toFile(imageBuffer, 'reference.jpg', { type: 'image/jpeg' });

    const response = await client.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: instruction,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    });

    const imageData = response.data?.[0];
    if (!imageData) return null;

    // gpt-image-1 returns base64 by default
    if (imageData.b64_json) {
      return `data:image/png;base64,${imageData.b64_json}`;
    }
    if (imageData.url) {
      return imageData.url;
    }
    return null;
  } catch (err) {
    console.error('[OpenAI edit error]', err);
    return null;
  }
}

async function generateTextToImage(
  client: OpenAI,
  category: string,
  style: string,
  notes?: string
): Promise<string | null> {
  try {
    const prompt = buildTextPrompt(category, style, notes);
    console.log(`[OpenAI generate] prompt=${prompt.substring(0, 100)}...`);

    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    });

    const imageData = response.data?.[0];
    if (!imageData) return null;
    if (imageData.b64_json) return `data:image/png;base64,${imageData.b64_json}`;
    if (imageData.url) return imageData.url;
    return null;
  } catch (err) {
    console.error('[OpenAI generate error]', err);
    return null;
  }
}

async function saveBase64ToSupabase(base64: string, projectId: string): Promise<string> {
  // Upload base64 image to Supabase Storage so it has a permanent URL
  const { supabaseAdmin } = await import('./supabase/admin');
  const { v4: uuidv4 } = await import('uuid');

  const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const filename = `generated/${projectId}/${uuidv4()}.png`;

  const { error } = await supabaseAdmin.storage
    .from('project-images')
    .upload(filename, buffer, { contentType: 'image/png', upsert: false });

  if (error) throw error;

  const { data } = supabaseAdmin.storage.from('project-images').getPublicUrl(filename);
  return data.publicUrl;
}

export async function generateConceptImages(params: {
  category: string;
  style: string;
  qualityTier: string;
  notes?: string;
  referenceImageUrl?: string;
  projectId: string;
  count?: number;
}): Promise<string[]> {
  const client = getClient();
  const count = params.count ?? 3;
  const results: string[] = [];

  if (params.referenceImageUrl) {
    // Generate variations with slightly different lighting/angle instructions
    const variations = [
      params.notes,
      params.notes
        ? `${params.notes}. Show the result in bright natural daytime lighting.`
        : 'Show the result in bright natural daytime lighting.',
      params.notes
        ? `${params.notes}. Show the result from a slightly wider angle to capture more context.`
        : 'Show the result from a slightly wider angle to capture more context.',
    ].slice(0, count);

    for (const variation of variations) {
      const result = await generateWithEdit(
        client,
        params.referenceImageUrl,
        params.category,
        params.style,
        variation
      );
      if (result) {
        // Save base64 to Supabase for permanent storage
        try {
          const url = result.startsWith('data:')
            ? await saveBase64ToSupabase(result, params.projectId)
            : result;
          results.push(url);
        } catch {
          results.push(result); // fallback: keep as base64 if storage fails
        }
      }
    }
  } else {
    // No reference photo — generate 1 high-quality generic concept
    const result = await generateTextToImage(client, params.category, params.style, params.notes);
    if (result) {
      try {
        const url = result.startsWith('data:')
          ? await saveBase64ToSupabase(result, params.projectId)
          : result;
        results.push(url);
      } catch {
        results.push(result);
      }
    }
  }

  return results;
}
