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
  kitchen: `You are a professional kitchen designer creating a photorealistic renovation rendering.
CHANGE: Replace the cabinets, countertops, backsplash, and hardware with {style}.
DO NOT CHANGE: The room dimensions, ceiling height, window size and position, floor area, appliance locations, walls, or structural elements.
The result must look like a real contractor's "after" photo taken from the same angle and position as the original photo.`,

  bathroom: `You are a professional bathroom designer creating a photorealistic renovation rendering.
CHANGE: Replace the tile (floor and wall), vanity, toilet, and fixtures with {style}.
DO NOT CHANGE: The room dimensions, ceiling height, window size and position, door location, or structural elements.
The result must look like a real contractor's "after" photo taken from the same angle and position as the original photo.`,

  flooring: `You are a professional flooring installer creating a photorealistic installation rendering.
CHANGE: Replace only the floor surface with {style} flooring.
DO NOT CHANGE: Every single other element — all furniture, all walls, all trim, all windows, all doors, all ceiling elements, all rugs, all lighting fixtures.
The result must look like a real before/after flooring installation photo taken from the exact same angle.`,

  interior_paint: `You are a professional painter creating a photorealistic painting rendering.
CHANGE: Repaint only the walls and trim with {style} colors.
DO NOT CHANGE: Every single other element — all furniture, flooring, windows, curtains, artwork, lighting, and ceiling.
The result must look like a real before/after painting photo taken from the exact same angle.`,

  roofing: `You are a professional roofing contractor creating a photorealistic replacement rendering.
CHANGE: Replace only the roof surface and materials with a new {style} roof.
DO NOT CHANGE: The house silhouette, all siding, all windows, all doors, the driveway, all trees, all landscaping, all neighboring structures, the sky, and all surroundings.
The result must look like a real roofing contractor's "after" photo of the exact same house.`,

  exterior_paint: `You are a professional exterior painter creating a photorealistic painting rendering.
CHANGE: Repaint only the siding and exterior trim with {style} colors.
DO NOT CHANGE: The roof color and material, all windows, all doors, all landscaping, the driveway, all neighboring structures, and all surroundings.
The result must look like a real exterior painting contractor's "after" photo of the exact same house.`,

  deck_patio: `You are a professional deck builder creating a photorealistic installation rendering.
CHANGE: Add a new {style} wood deck structure to the indicated backyard area. The deck should look structurally sound with proper posts, beams, decking boards, and railings.
DO NOT CHANGE: The house structure, siding, windows, doors, roof, existing fence lines, existing mature trees, and the overall yard dimensions.
The result must look like a real deck contractor's "after" photo.`,

  landscaping: `You are a professional landscape architect creating a photorealistic design rendering.
CHANGE: Transform the lawn and garden areas with {style} professional landscaping including graded lawn, defined garden beds, appropriate shrubs and plantings.
DO NOT CHANGE: The house structure, driveway, hardscape elements, fence lines, mature trees, and neighboring properties.
The result must look like a real landscaping contractor's "after" photo.`,
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
    // Generate variations with useful framing differences
    const variations = [
      undefined,  // clean instruction, no additions
      'Focus on showing the finished result clearly with good lighting that shows material quality and craftsmanship.',
      'Show the result with a slightly wider view to show how the renovation fits within the overall space.',
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
