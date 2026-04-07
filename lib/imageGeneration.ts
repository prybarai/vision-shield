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
import { type VisionAnalysis } from '@/lib/visionAnalysis';
import { extractDesignConstraints, type DesignConstraints } from '@/lib/designConstraints';

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

const EDIT_INSTRUCTIONS: Record<string, string> = {
  kitchen: `You are a professional kitchen designer creating a photorealistic renovation rendering.
CHANGE: Replace the cabinets, countertops, backsplash, and hardware.
DO NOT CHANGE: The room dimensions, ceiling height, window size and position, floor area, appliance locations, walls, or structural elements.
The result must look like a real contractor's "after" photo taken from the same angle and position as the original photo.`,

  bathroom: `You are a professional bathroom designer creating a photorealistic renovation rendering.
CHANGE: Replace the tile (floor and wall), vanity, toilet, and fixtures.
DO NOT CHANGE: The room dimensions, ceiling height, window size and position, door location, or structural elements.
The result must look like a real contractor's "after" photo taken from the same angle and position as the original photo.`,

  flooring: `You are a professional flooring installer creating a photorealistic installation rendering.
CHANGE: Replace only the floor surface.
DO NOT CHANGE: Every single other element — all furniture, all walls, all trim, all windows, all doors, all ceiling elements, all rugs, all lighting fixtures.
The result must look like a real before/after flooring installation photo taken from the exact same angle.`,

  interior_paint: `You are a professional painter creating a photorealistic painting rendering.
CHANGE: Repaint only the walls and trim.
DO NOT CHANGE: Every single other element — all furniture, flooring, windows, curtains, artwork, lighting, and ceiling.
The result must look like a real before/after painting photo taken from the exact same angle.`,

  roofing: `You are a professional roofing contractor creating a photorealistic replacement rendering.
CHANGE: Replace only the roof surface and materials.
DO NOT CHANGE: The house silhouette, all siding, all windows, all doors, the driveway, all trees, all landscaping, all neighboring structures, the sky, and all surroundings.
The result must look like a real roofing contractor's "after" photo of the exact same house.`,

  exterior_paint: `You are a professional exterior design visualizer creating a photorealistic repaint rendering.
CHANGE: Repaint only the siding and exterior trim.
DO NOT CHANGE: The roof shape, roof material, windows, doors, landscaping, driveway, neighboring homes, or house structure.
The final result must follow the requested colors exactly and look like a real contractor's after photo of the same house.`,

  deck_patio: `You are a professional deck builder creating a photorealistic installation rendering.
CHANGE: Add a new deck or patio structure only in the indicated backyard area.
DO NOT CHANGE: The house structure, siding, windows, doors, roof, existing fence lines, existing mature trees, and the overall yard dimensions.
The result must look like a real deck contractor's "after" photo.`,

  landscaping: `You are a professional landscape architect creating a photorealistic design rendering.
CHANGE: Transform the lawn and garden areas with professional landscaping including graded lawn, defined garden beds, appropriate shrubs and plantings.
DO NOT CHANGE: The house structure, driveway, hardscape elements, fence lines, mature trees, and neighboring properties.
The result must look like a real landscaping contractor's "after" photo.`,
};

const TEXT_PROMPTS: Record<string, string> = {
  kitchen: 'Professional real estate photograph of a beautifully renovated kitchen. High-end photography, photorealistic, no watermarks.',
  bathroom: 'Professional real estate photograph of a beautifully renovated bathroom. High-end photography, photorealistic, no watermarks.',
  flooring: 'Professional interior design photograph of a bright living room with brand new flooring. Photorealistic, no watermarks.',
  interior_paint: 'Professional interior design photograph of a bright living room freshly painted with updated trim. Photorealistic, no watermarks.',
  roofing: 'Professional real estate photograph of a beautiful suburban home with a brand new roof. Photorealistic, no watermarks.',
  exterior_paint: 'Professional real estate photograph of a beautiful home freshly repainted with great curb appeal. Photorealistic, no watermarks.',
  deck_patio: 'Professional real estate photograph of a beautiful backyard with a brand new deck and outdoor living area. Photorealistic, no watermarks.',
  landscaping: 'Professional real estate photograph of a home with beautifully landscaped grounds and manicured lawn. Photorealistic, no watermarks.',
};

function buildAnalysisPromptContext(category: string, analysis?: VisionAnalysis): string {
  if (!analysis) return '';

  const facts: string[] = [];

  if (category === 'exterior_paint') {
    if (analysis.scope_signals.stories) facts.push(`This is a ${analysis.scope_signals.stories}-story house.`);
    if ((analysis.scope_signals.window_count_visible ?? 0) >= 6) facts.push('There are many front-facing windows. Preserve the house structure and visible windows exactly.');
    if (analysis.scope_signals.paint_complexity) facts.push(`The exterior has ${analysis.scope_signals.paint_complexity} paint complexity.`);
  } else if (category === 'roofing') {
    if (analysis.scope_signals.stories) facts.push(`This appears to be a ${analysis.scope_signals.stories}-story house.`);
    if (analysis.scope_signals.roof_complexity) facts.push(`The roof appears ${analysis.scope_signals.roof_complexity} complexity.`);
    facts.push('Keep the roofline and any dormers structurally consistent.');
  } else if (category === 'interior_paint') {
    if (analysis.scope_signals.room_size) facts.push(`This appears to be a ${analysis.scope_signals.room_size} room.`);
    if ((analysis.scope_signals.window_count_visible ?? 0) >= 4) facts.push('There are many windows. Only change wall and trim colors; preserve furniture and windows.');
    if (analysis.scope_signals.ceiling_height) facts.push(`Ceiling height appears ${analysis.scope_signals.ceiling_height}.`);
  } else if (category === 'deck_patio') {
    if (analysis.scope_signals.yard_size) facts.push(`The yard appears ${analysis.scope_signals.yard_size}.`);
    if (analysis.scope_signals.access_difficulty) facts.push(`Access appears ${analysis.scope_signals.access_difficulty}. Keep the house structure and fence lines unchanged.`);
  }

  if (!facts.length) {
    if (analysis.property_type !== 'unknown') facts.push(`Existing property type appears to be ${analysis.property_type.replace(/_/g, ' ')}.`);
    if (analysis.visible_features.length) facts.push(`Preserve visible elements like ${analysis.visible_features.slice(0, 3).join(', ')}.`);
  }

  return facts.slice(0, 4).join(' ');
}

export function buildConstraintText(category: string, constraints: DesignConstraints, notes?: string): string {
  const lines: string[] = [];

  if (category === 'exterior_paint') {
    if (constraints.bodyColor) {
      lines.push(`Use ${constraints.bodyColor} as the main body/siding color.`);
      if (constraints.bodyColor === 'cream white') {
        lines.push('Do not use brown or tan as the dominant exterior color.');
      }
    }
    if (constraints.trimColor && constraints.accentColor && constraints.trimColor === constraints.accentColor) {
      lines.push(`Use ${constraints.trimColor} for trim and accent details.`);
    } else {
      if (constraints.trimColor) lines.push(`Use ${constraints.trimColor} trim. This is required.`);
      if (constraints.accentColor) lines.push(`Use ${constraints.accentColor} accent details. This is required.`);
    }
    if (constraints.accentColor === 'black' || constraints.trimColor === 'black') {
      lines.push('Do not use wood-tone or bronze accents instead of black.');
    }
    if (constraints.roofColor && /\broof\b/i.test(notes || '')) {
      lines.push(`Use ${constraints.roofColor} for the roof color only if the request explicitly includes changing the roof.`);
    }
    if (lines.length > 0) {
      lines.push('These user-specified colors are mandatory and must override generic style suggestions.');
    }
  }

  if (category === 'deck_patio' && constraints.deckMaterial) {
    lines.push(`Use ${constraints.deckMaterial} deck boards. This material selection is required.`);
  }

  if (category === 'flooring' && constraints.flooringMaterial) {
    lines.push(`Use ${constraints.flooringMaterial} flooring. This material selection is required.`);
  }

  if ((category === 'kitchen' || category === 'bathroom') && constraints.cabinetColor) {
    lines.push(`Use ${constraints.cabinetColor} cabinets or vanity cabinetry. This color choice is required.`);
  }
  if ((category === 'kitchen' || category === 'bathroom') && constraints.countertopMaterial) {
    lines.push(`Use ${constraints.countertopMaterial} countertops. This material selection is required.`);
  }
  if ((category === 'kitchen' || category === 'bathroom') && constraints.tileStyle) {
    lines.push(`Use ${constraints.tileStyle} tile where tile is shown. This style choice is required.`);
  }

  if (category === 'roofing' && constraints.roofColor) {
    lines.push(`Use ${constraints.roofColor} for the roof color. This is required.`);
  }

  if (category === 'interior_paint') {
    if (constraints.bodyColor) lines.push(`Use ${constraints.bodyColor} as the primary wall color. This is required.`);
    if (constraints.trimColor) lines.push(`Use ${constraints.trimColor} trim. This is required.`);
  }

  if (lines.length === 0 && notes) {
    return `Honor the user's notes exactly where they specify materials, finishes, or colors: ${notes}`;
  }

  if (constraints.explicitRequirements.length > 0) {
    lines.push(`Original user note: ${constraints.explicitRequirements[0]}`);
  }

  return lines.join(' ');
}

function buildInstruction(
  category: string,
  style: string,
  notes?: string,
  analysis?: VisionAnalysis,
  extraGuidance?: string
): string {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const baseInstruction = EDIT_INSTRUCTIONS[category] || 'Renovate this property while keeping structural elements intact.';
  const analysisContext = buildAnalysisPromptContext(category, analysis);
  const constraints = extractDesignConstraints(notes);
  const constraintText = buildConstraintText(category, constraints, notes);
  const categoryInstruction = category === 'exterior_paint'
    ? 'Category-specific direction: Repaint only the existing siding and trim on this exact house. Match the requested color placement faithfully.'
    : category === 'deck_patio'
    ? 'Category-specific direction: Add the requested deck or patio design without changing the house itself.'
    : category === 'flooring'
    ? 'Category-specific direction: Replace only the visible flooring surface.'
    : category === 'kitchen' || category === 'bathroom'
    ? 'Category-specific direction: Apply the requested materials to the intended renovation surfaces while preserving room geometry.'
    : `Category-specific direction: Apply a ${styleDesc} renovation for the ${category.replace(/_/g, ' ')} project.`;

  return [
    baseInstruction,
    analysisContext ? `Structural preservation notes: ${analysisContext}` : '',
    constraintText ? `MANDATORY DESIGN REQUIREMENTS: ${constraintText}` : '',
    categoryInstruction,
    `Style guidance: ${styleDesc}.`,
    extraGuidance ? `Presentation guidance: ${extraGuidance}` : '',
  ].filter(Boolean).join(' ');
}

function buildTextPrompt(
  category: string,
  style: string,
  notes?: string,
  analysis?: VisionAnalysis,
  extraGuidance?: string
): string {
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const basePrompt = TEXT_PROMPTS[category] || 'Professional photograph of a home renovation.';
  const analysisContext = buildAnalysisPromptContext(category, analysis);
  const constraints = extractDesignConstraints(notes);
  const constraintText = buildConstraintText(category, constraints, notes);

  return [
    basePrompt,
    analysisContext ? `Structural preservation notes: ${analysisContext}` : '',
    constraintText ? `Mandatory user constraints: ${constraintText}` : '',
    `Category direction: ${category.replace(/_/g, ' ')} rendered in a ${styleDesc} direction.`,
    extraGuidance ? `Presentation guidance: ${extraGuidance}` : '',
  ].filter(Boolean).join(' ');
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
  notes?: string,
  analysis?: VisionAnalysis,
  extraGuidance?: string
): Promise<string | null> {
  try {
    const instruction = buildInstruction(category, style, notes, analysis, extraGuidance);
    console.log(`[OpenAI edit] category=${category} style=${style}`);
    console.log(`[OpenAI edit] instruction=${instruction.substring(0, 180)}...`);

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
  notes?: string,
  analysis?: VisionAnalysis,
  extraGuidance?: string
): Promise<string | null> {
  try {
    const prompt = buildTextPrompt(category, style, notes, analysis, extraGuidance);
    console.log(`[OpenAI generate] interior=${INTERIOR_CATEGORIES.has(category)} prompt=${prompt.substring(0, 180)}...`);

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
  analysis?: VisionAnalysis;
  projectId: string;
  count?: number;
}): Promise<string[]> {
  const client = getClient();
  const count = params.count ?? 3;
  const results: string[] = [];

  if (params.referenceImageUrl) {
    const variations = [
      undefined,
      'Focus on showing the finished result clearly with good lighting that shows material quality and craftsmanship.',
      'Show the result with a slightly wider view to show how the renovation fits within the overall space.',
    ].slice(0, count);

    for (const variation of variations) {
      const result = await generateWithEdit(
        client,
        params.referenceImageUrl,
        params.category,
        params.style,
        params.notes,
        params.analysis,
        variation
      );
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
  } else {
    const result = await generateTextToImage(client, params.category, params.style, params.notes, params.analysis);
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
