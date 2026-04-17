export interface DesignConstraints {
  bodyColor?: string;
  accentColor?: string;
  trimColor?: string;
  roofColor?: string;
  deckMaterial?: string;
  flooringMaterial?: string;
  cabinetColor?: string;
  countertopMaterial?: string;
  tileStyle?: string;
  explicitRequirements: string[];
}

const COLOR_PATTERNS: Array<{ value: string; pattern: RegExp }> = [
  { value: 'cream white', pattern: /\bcream\s+white\b/i },
  { value: 'natural wood', pattern: /\bnatural\s+wood\b/i },
  { value: 'charcoal', pattern: /\bcharcoal\b/i },
  { value: 'black', pattern: /\bblack\b/i },
  { value: 'white', pattern: /\bwhite\b/i },
  { value: 'navy', pattern: /\bnavy\b/i },
  { value: 'sage', pattern: /\bsage\b/i },
  { value: 'beige', pattern: /\bbeige\b/i },
  { value: 'gray', pattern: /\bgr[ae]y\b/i },
  { value: 'walnut', pattern: /\bwalnut\b/i },
  { value: 'oak', pattern: /\boak\b/i },
];

const DECK_MATERIAL_PATTERNS: Array<{ value: string; pattern: RegExp }> = [
  { value: 'redwood', pattern: /\bredwood\b/i },
  { value: 'cedar', pattern: /\bcedar\b/i },
  { value: 'composite', pattern: /\bcomposite\b/i },
  { value: 'pressure treated', pattern: /\bpressure[ -]?treated\b/i },
];

const FLOORING_PATTERNS: Array<{ value: string; pattern: RegExp }> = [
  { value: 'hardwood', pattern: /\bhardwood\b/i },
  { value: 'oak', pattern: /\boak\b/i },
  { value: 'walnut', pattern: /\bwalnut\b/i },
  { value: 'lvp', pattern: /\blvp\b|luxury\s+vinyl\s+plank/i },
  { value: 'laminate', pattern: /\blaminate\b/i },
  { value: 'tile', pattern: /\btile\b/i },
];

function detectColor(notes: string): string | undefined {
  return COLOR_PATTERNS.find(({ pattern }) => pattern.test(notes))?.value;
}

function detectDeckMaterial(notes: string): string | undefined {
  return DECK_MATERIAL_PATTERNS.find(({ pattern }) => pattern.test(notes))?.value;
}

function detectFlooringMaterial(notes: string): string | undefined {
  return FLOORING_PATTERNS.find(({ pattern }) => pattern.test(notes))?.value;
}

function extractExplicitColorTarget(notes: string, target: string): string | undefined {
  const match = notes.match(new RegExp(`((?:cream\\s+white|natural\\s+wood|charcoal|white|black|navy|sage|beige|gr[ae]y|walnut|oak)[\\w\\s-]*)\\s+${target}`, 'i'));
  return match?.[1] ? detectColor(match[1]) ?? match[1].trim().toLowerCase() : undefined;
}

function normalizeMaterial(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function extractDesignConstraints(notes?: string): DesignConstraints {
  const original = notes;
  const text = notes?.trim();

  const constraints: DesignConstraints = {
    explicitRequirements: [],
  };

  if (!text) return constraints;

  let foundConstraint = false;

  if (/\bcream\s+white\s+house\b/i.test(text)) {
    constraints.bodyColor = 'cream white';
    foundConstraint = true;
  }

  const explicitHouseColor = text.match(/\b(cream\s+white|white|black|charcoal|navy|sage|beige|gr[ae]y)\s+(house|home|exterior|siding)\b/i);
  if (!constraints.bodyColor && explicitHouseColor) {
    constraints.bodyColor = detectColor(explicitHouseColor[1]) ?? normalizeMaterial(explicitHouseColor[1]);
    foundConstraint = true;
  }

  const blackAccents = /\bblack\s+accents?\b/i.test(text);
  if (blackAccents) {
    constraints.accentColor = 'black';
    constraints.trimColor = 'black';
    foundConstraint = true;
  }

  const blackTrim = /\bblack\s+trim\b/i.test(text);
  if (blackTrim) {
    constraints.trimColor = 'black';
    foundConstraint = true;
  }

  const roofColor = extractExplicitColorTarget(text, 'roof');
  if (roofColor) {
    constraints.roofColor = roofColor;
    foundConstraint = true;
  }

  const deckMaterial = detectDeckMaterial(text);
  if (deckMaterial && /\b(deck|patio)\b/i.test(text)) {
    constraints.deckMaterial = deckMaterial;
    foundConstraint = true;
  }

  const flooringMaterial = detectFlooringMaterial(text);
  if (flooringMaterial && /\b(floor|flooring|floors)\b/i.test(text)) {
    constraints.flooringMaterial = flooringMaterial;
    foundConstraint = true;
  }

  const cabinetColorMatch = text.match(/\b(cream\s+white|white|black|charcoal|navy|sage|beige|gr[ae]y|natural\s+wood|walnut|oak)\s+cabinets?\b/i)
    || text.match(/\bcabinets?\s+(?:in|painted|are)\s+(cream\s+white|white|black|charcoal|navy|sage|beige|gr[ae]y|natural\s+wood|walnut|oak)\b/i);
  if (cabinetColorMatch) {
    constraints.cabinetColor = detectColor(cabinetColorMatch[1]) ?? normalizeMaterial(cabinetColorMatch[1]);
    foundConstraint = true;
  }

  const countertopMatch = text.match(/\b(quartz|quartzite|granite|marble|butcher\s+block|laminate|concrete)\s+countertops?\b/i)
    || text.match(/\bcountertops?\s+(?:in|with|are)\s+(quartz|quartzite|granite|marble|butcher\s+block|laminate|concrete)\b/i);
  if (countertopMatch) {
    constraints.countertopMaterial = normalizeMaterial(countertopMatch[1]);
    foundConstraint = true;
  }

  const tileMatch = text.match(/\b(subway|zellige|mosaic|hex|hexagon|large\s+format|stacked)\s+tile\b/i)
    || text.match(/\btile\s+(?:style|look)\s*:?\s*(subway|zellige|mosaic|hex|hexagon|large\s+format|stacked)\b/i);
  if (tileMatch) {
    constraints.tileStyle = normalizeMaterial(tileMatch[1] === 'hexagon' ? 'hex' : tileMatch[1]);
    foundConstraint = true;
  }

  if (foundConstraint && original) {
    constraints.explicitRequirements.push(original);
  }

  return constraints;
}
