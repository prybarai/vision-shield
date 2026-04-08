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

const INTERIOR_CATEGORIES = new Set(['kitchen', 'bathroom', 'flooring', 'interior_paint', 'custom_project']);

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
DO NOT CHANGE: Every single other element, including all furniture, layout, walls, trim, windows, doors, ceiling elements, rugs, and lighting fixtures.
The result must look like a real before/after flooring installation photo taken from the exact same angle.`,

  interior_paint: `You are a professional painter creating a photorealistic painting rendering.
CHANGE: Repaint only the walls and trim.
DO NOT CHANGE: Every single other element, including furniture, flooring, layout, windows, curtains, artwork, lighting, and ceiling.
The result must look like a real before/after painting photo taken from the exact same angle.`,

  roofing: `You are a professional roofing contractor creating a photorealistic replacement rendering.
CHANGE: Replace only the roof surface and roofing materials.
DO NOT CHANGE: The house silhouette, siding, windows, doors, driveway, neighbors, sky, landscaping, trees, or any surroundings unless explicitly requested.
The result must look like a real roofing contractor's "after" photo of the exact same house.`,

  exterior_paint: `You are a professional exterior design visualizer creating a photorealistic repaint rendering.
CHANGE: Repaint only the siding, body, trim, and requested exterior accent details.
DO NOT CHANGE: Roof form, windows, doors, landscaping, driveway, neighboring homes, or any house structure.
The final result must follow the requested body, trim, and accent colors exactly and look like a real contractor's after photo of the same house.`,

  deck_patio: `You are a professional deck builder creating a photorealistic installation rendering.
CHANGE: Add or update only the requested deck or patio scope.
DO NOT CHANGE: House form, siding, windows, doors, roof, neighbors, sky, landscape, fence lines, or existing yard layout unless explicitly requested.
The result must look like a real deck contractor's "after" photo.`,

  landscaping: `You are a professional landscape architect creating a photorealistic design rendering.
CHANGE: Transform the lawn and garden areas with professional landscaping including graded lawn, defined garden beds, appropriate shrubs and plantings.
DO NOT CHANGE: The house structure, driveway, hardscape elements, fence lines, mature trees, and neighboring properties.
The result must look like a real landscaping contractor's "after" photo.`,

  custom_project: `You are a professional renovation visualizer creating a photorealistic custom project rendering.
CHANGE: Apply the exact requested design update described by the homeowner.
DO NOT CHANGE: Structural layout, room geometry, building envelope, and any visible elements not requested by the homeowner.
Prioritize the homeowner notes over generic style direction.
The result must look like a real contractor's realistic planning rendering from the same viewpoint as the original photo.`,
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
  custom_project: 'Professional real estate style photograph of a realistic custom home improvement update, photorealistic, no watermarks.',
};

function buildAnalysisPromptContext(category: string, analysis?: VisionAnalysis): string {
  if (!analysis) return '';

  const facts: string[] = [];

  if (category === 'exterior_paint') {
    if (analysis.scope_signals.stories) facts.push(`This is a ${analysis.scope_signals.stories}-story house.`);
    if ((analysis.scope_signals.window_count_visible ?? 0) >= 6) facts.push('There are many front-facing windows. Preserve the structure and every visible window exactly.');
    if (analysis.scope_signals.paint_complexity) facts.push(`The exterior has ${analysis.scope_signals.paint_complexity} paint complexity.`);
  } else if (category === 'roofing') {
    if (analysis.scope_signals.stories) facts.push(`This appears to be a ${analysis.scope_signals.stories}-story house.`);
    if (analysis.scope_signals.roof_complexity) facts.push(`The roof appears ${analysis.scope_signals.roof_complexity} complexity.`);
    facts.push('Keep the roofline, dormers, and house shape structurally consistent.');
  } else if (category === 'interior_paint') {
    if (analysis.scope_signals.room_size) facts.push(`This appears to be a ${analysis.scope_signals.room_size} room.`);
    if ((analysis.scope_signals.window_count_visible ?? 0) >= 4) facts.push('There are many windows. Change only wall and trim color and preserve furniture, layout, and windows.');
    if (analysis.scope_signals.ceiling_height) facts.push(`Ceiling height appears ${analysis.scope_signals.ceiling_height}.`);
  } else if (category === 'deck_patio') {
    if (analysis.scope_signals.yard_size) facts.push(`The yard appears ${analysis.scope_signals.yard_size}.`);
    if (analysis.scope_signals.access_difficulty) facts.push(`Access appears ${analysis.scope_signals.access_difficulty}. Keep the house structure and surrounding yard context unchanged.`);
  }

  if (!facts.length) {
    if (analysis.property_type !== 'unknown') facts.push(`Existing property type appears to be ${analysis.property_type.replace(/_/g, ' ')}.`);
    if (analysis.visible_features.length) facts.push(`Preserve visible elements like ${analysis.visible_features.slice(0, 3).join(', ')}.`);
  }

  return facts.slice(0, 4).join(' ');
}

function hasStrongExactConstraint(constraints: DesignConstraints) {
  return Boolean(
    constraints.bodyColor ||
    constraints.trimColor ||
    constraints.accentColor ||
    constraints.flooringMaterial ||
    constraints.deckMaterial ||
    constraints.roofColor ||
    constraints.cabinetColor ||
    constraints.countertopMaterial ||
    constraints.tileStyle
  );
}

export function buildConstraintText(category: string, constraints: DesignConstraints, notes?: string): string {
  const lines: string[] = [];

  if (category === 'exterior_paint') {
    if (constraints.bodyColor) lines.push(`Main body or siding color must be ${constraints.bodyColor}.`);
    if (constraints.trimColor) lines.push(`Trim color must be ${constraints.trimColor}.`);
    if (constraints.accentColor) lines.push(`Accent color must be ${constraints.accentColor}.`);
    if (constraints.bodyColor || constraints.trimColor || constraints.accentColor) {
      lines.push('Keep color placement literal: body stays on body surfaces, trim stays on trim, accents stay on accent details only.');
    }
    if (constraints.accentColor === 'black' || constraints.trimColor === 'black') {
      lines.push('Do not substitute bronze, wood tone, or charcoal where black was requested.');
    }
    if (constraints.roofColor && /\broof\b/i.test(notes || '')) {
      lines.push(`Only if roof changes were explicitly requested, the roof color must be ${constraints.roofColor}.`);
    }
    if (lines.length > 0) lines.push('These user-specified exterior colors are mandatory and override generic style language.');
  }

  if (category === 'deck_patio' && constraints.deckMaterial) {
    lines.push(`Deck or patio material must be ${constraints.deckMaterial}.`);
  }

  if (category === 'flooring' && constraints.flooringMaterial) {
    lines.push(`Flooring material must be ${constraints.flooringMaterial}.`);
  }

  if ((category === 'kitchen' || category === 'bathroom') && constraints.cabinetColor) {
    lines.push(`Cabinet or vanity color must be ${constraints.cabinetColor}.`);
  }
  if ((category === 'kitchen' || category === 'bathroom') && constraints.countertopMaterial) {
    lines.push(`Countertop material must be ${constraints.countertopMaterial}.`);
  }
  if ((category === 'kitchen' || category === 'bathroom') && constraints.tileStyle) {
    lines.push(`Tile style must be ${constraints.tileStyle}.`);
  }

  if (category === 'roofing' && constraints.roofColor) {
    lines.push(`Roof color must be ${constraints.roofColor}.`);
  }

  if (category === 'interior_paint') {
    if (constraints.bodyColor) lines.push(`Primary wall color must be ${constraints.bodyColor}.`);
    if (constraints.trimColor) lines.push(`Trim color must be ${constraints.trimColor}.`);
  }

  if (lines.length === 0 && notes) {
    return `Honor the user's notes exactly where they specify materials, finishes, or colors: ${notes}`;
  }

  if (constraints.explicitRequirements.length > 0) {
    lines.push(`Original user note: ${constraints.explicitRequirements[0]}`);
  }

  return lines.join(' ');
}

function resolveCustomProjectCategory(category: string, analysis?: VisionAnalysis): string {
  if (category !== 'custom_project') return category;

  const trade = analysis?.suggested_trade;
  const locationType = analysis?.suggested_location_type;

  if (trade === 'paint') return locationType === 'exterior' ? 'exterior_paint' : 'interior_paint';
  if (trade === 'flooring') return 'flooring';
  if (trade === 'roofing') return 'roofing';
  if (trade === 'deck') return 'deck_patio';
  if (trade === 'landscaping') return 'landscaping';
  if (trade === 'bathroom') return 'bathroom';
  if (trade === 'kitchen') return 'kitchen';

  return 'custom_project';
}

function buildStyleGuidance(category: string, styleDesc: string, constraints: DesignConstraints, notes?: string) {
  const exactConstraintHeavy = hasStrongExactConstraint(constraints) || /exact|must be|specific|match/i.test(notes || '');
  if (category === 'custom_project') {
    return exactConstraintHeavy
      ? 'Use the homeowner notes as the dominant instruction. Apply only light stylistic interpretation where the notes leave room.'
      : `Use ${styleDesc} styling only where it does not conflict with the homeowner notes.`;
  }
  if (exactConstraintHeavy && (category === 'exterior_paint' || category === 'roofing' || category === 'flooring' || category === 'interior_paint' || category === 'deck_patio')) {
    return 'Keep style influence light so exact requested colors and materials stay dominant.';
  }
  return `Style guidance: ${styleDesc}.`;
}

function buildInstruction(
  category: string,
  style: string,
  notes?: string,
  analysis?: VisionAnalysis,
  extraGuidance?: string
): string {
  const resolvedCategory = resolveCustomProjectCategory(category, analysis);
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const baseInstruction = EDIT_INSTRUCTIONS[resolvedCategory] || EDIT_INSTRUCTIONS[category] || 'Renovate this property while keeping structural elements intact.';
  const analysisContext = buildAnalysisPromptContext(resolvedCategory, analysis);
  const constraints = extractDesignConstraints(notes);
  const constraintText = buildConstraintText(resolvedCategory, constraints, notes);
  const categoryInstruction = category === 'custom_project'
    ? resolvedCategory === 'custom_project'
      ? 'Category-specific direction: Apply the requested custom design/update described by the homeowner while preserving the property structure and unchanged areas exactly.'
      : `Category-specific direction: Treat this custom project like a ${resolvedCategory.replace(/_/g, ' ')} scope while preserving all unchanged areas exactly.`
    : resolvedCategory === 'exterior_paint'
    ? 'Category-specific direction: Repaint only the existing siding, body, trim, and requested accent details on this exact house. Follow body/trim/accent color placement literally.'
    : resolvedCategory === 'deck_patio'
    ? 'Category-specific direction: Add the requested deck or patio design without changing the house, neighbors, sky, or surrounding landscape.'
    : resolvedCategory === 'flooring'
    ? 'Category-specific direction: Replace only the visible flooring surface and preserve furniture, layout, and windows exactly.'
    : resolvedCategory === 'kitchen' || resolvedCategory === 'bathroom'
    ? 'Category-specific direction: Apply the requested materials to the intended renovation surfaces while preserving room geometry.'
    : `Category-specific direction: Apply a ${styleDesc} renovation for the ${resolvedCategory.replace(/_/g, ' ')} project.`;

  return [
    baseInstruction,
    analysisContext ? `Structural preservation notes: ${analysisContext}` : '',
    constraintText ? `MANDATORY DESIGN REQUIREMENTS: ${constraintText}` : '',
    categoryInstruction,
    buildStyleGuidance(category, styleDesc, constraints, notes),
    extraGuidance ? `Presentation guidance: ${extraGuidance}` : '',
    'Return one highly believable concept, not multiple alternatives inside one image.',
  ].filter(Boolean).join(' ');
}

function buildTextPrompt(
  category: string,
  style: string,
  notes?: string,
  analysis?: VisionAnalysis,
  extraGuidance?: string
): string {
  const resolvedCategory = resolveCustomProjectCategory(category, analysis);
  const styleDesc = STYLE_DESCRIPTORS[style] || style;
  const basePrompt = TEXT_PROMPTS[resolvedCategory] || TEXT_PROMPTS[category] || 'Professional photograph of a home renovation.';
  const analysisContext = buildAnalysisPromptContext(resolvedCategory, analysis);
  const constraints = extractDesignConstraints(notes);
  const constraintText = buildConstraintText(resolvedCategory, constraints, notes);

  return [
    basePrompt,
    analysisContext ? `Structural preservation notes: ${analysisContext}` : '',
    constraintText ? `Mandatory user constraints: ${constraintText}` : '',
    `Category direction: ${category === 'custom_project' ? 'custom project' : resolvedCategory.replace(/_/g, ' ')}.`,
    buildStyleGuidance(category, styleDesc, constraints, notes),
    extraGuidance ? `Presentation guidance: ${extraGuidance}` : '',
    'Generate one high-quality, photorealistic concept only.',
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
  const requestedCount = params.count ?? 1;
  const count = Math.min(1, requestedCount || 1);
  const results: string[] = [];

  if (params.referenceImageUrl) {
    const variation = 'Show the requested finished concept clearly, keep unchanged areas untouched, and prioritize realism over dramatic redesign.';
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
  } else {
    const result = await generateTextToImage(
      client,
      params.category,
      params.style,
      params.notes,
      params.analysis,
      'Show one useful first concept that respects the notes literally and avoids extra design flourishes.'
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

  return results.slice(0, count);
}
