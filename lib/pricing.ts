export type PricingGuideKey = 'bathroom' | 'interior_paint' | 'deck_patio' | 'roofing' | 'kitchen';

export interface PricingPlanningRange {
  label: string;
  range: string;
  note: string;
}

export interface PricingSourceLink {
  label: string;
  url: string;
}

interface PricingGuideDefinition {
  planningRanges: PricingPlanningRange[];
  estimatorFloor: { low: number; mid: number; high: number };
  scopeMids?: Record<string, number>;
  publicSources: PricingSourceLink[];
}

const PRICING_GUIDES: Record<PricingGuideKey, PricingGuideDefinition> = {
  bathroom: {
    planningRanges: [
      { label: 'Cosmetic refresh', range: '$8,000 to $15,000', note: 'Paint, vanity, fixture swaps, limited tile, minimal plumbing changes.' },
      { label: 'Mid-range remodel', range: '$15,000 to $30,000', note: 'New finishes throughout, better shower/tub work, some electrical and plumbing updates.' },
      { label: 'Full custom or layout change', range: '$30,000+', note: 'Moving plumbing, premium materials, extensive tile, larger primary baths, or structural work.' },
    ],
    estimatorFloor: { low: 8000, mid: 11000, high: 15000 },
    scopeMids: {
      cosmetic: 11000,
      mid_refresh: 22000,
      full_remodel: 36000,
    },
    publicSources: [
      { label: 'Remodeling, Cost vs. Value Report', url: 'https://www.remodeling.hw.net/cost-vs-value/' },
    ],
  },
  interior_paint: {
    planningRanges: [
      { label: 'Single room refresh', range: '$400 to $1,200', note: 'Basic walls, limited prep, normal ceiling height, homeowner-provided clearing.' },
      { label: 'Multi-room repaint', range: '$2,000 to $6,000', note: 'Several rooms, standard prep, trim and ceilings depending on scope.' },
      { label: 'Whole-home interior', range: '$5,000 to $15,000+', note: 'Large square footage, heavy prep, doors, trim, ceilings, stairwells, or premium coatings.' },
    ],
    estimatorFloor: { low: 400, mid: 800, high: 1200 },
    publicSources: [],
  },
  deck_patio: {
    planningRanges: [
      { label: 'Basic pressure-treated deck', range: '$4,000 to $8,000', note: 'Smaller footprint, simple shape, low height, straightforward access.' },
      { label: 'Mid-range family deck', range: '$8,000 to $18,000', note: 'Larger footprint, rails, stairs, upgraded framing or finishes.' },
      { label: 'Premium composite or custom build', range: '$18,000+', note: 'Composite or hardwood, complex layout, multiple elevations, lighting, skirting, or heavy site work.' },
    ],
    estimatorFloor: { low: 4000, mid: 6000, high: 8000 },
    publicSources: [],
  },
  roofing: {
    planningRanges: [
      { label: 'Basic asphalt replacement', range: '$6,000 to $12,000', note: 'Straightforward roof geometry, standard tear-off, common shingle systems.' },
      { label: 'Larger or steeper roof', range: '$12,000 to $20,000', note: 'More squares, harder access, upgraded shingles, more flashing detail.' },
      { label: 'Premium material or complex roof', range: '$20,000+', note: 'Metal, tile, specialty systems, heavy repair scope, or high-complexity rooflines.' },
    ],
    estimatorFloor: { low: 6000, mid: 9000, high: 12000 },
    publicSources: [],
  },
  kitchen: {
    planningRanges: [
      { label: 'Refresh or partial update', range: '$15,000 to $25,000', note: 'Painted or refaced cabinets, counters, backsplash, fixtures, selected appliance updates.' },
      { label: 'Mid-range remodel', range: '$25,000 to $60,000', note: 'New cabinets and counters, flooring, lighting, appliances, moderate trade coordination.' },
      { label: 'Major redesign or premium kitchen', range: '$60,000+', note: 'Layout changes, custom cabinets, premium appliances, structural work, or extensive finish upgrades.' },
    ],
    estimatorFloor: { low: 15000, mid: 20000, high: 25000 },
    scopeMids: {
      cosmetic: 20000,
      mid_refresh: 42500,
      full_remodel: 80000,
    },
    publicSources: [
      { label: 'Remodeling, Cost vs. Value Report', url: 'https://www.remodeling.hw.net/cost-vs-value/' },
    ],
  },
};

export function getPricingPlanningRanges(key: PricingGuideKey) {
  return PRICING_GUIDES[key].planningRanges.map((item) => ({ ...item }));
}

export function getPricingPublicSources(key: PricingGuideKey) {
  return PRICING_GUIDES[key].publicSources.map((item) => ({ ...item }));
}

export function getEstimatorFloor(key: PricingGuideKey) {
  return PRICING_GUIDES[key].estimatorFloor;
}

export function getScopeMids(key: Extract<PricingGuideKey, 'bathroom' | 'kitchen'>) {
  return { ...(PRICING_GUIDES[key].scopeMids || {}) };
}
