export interface RegionalPricingContext {
  zip: string;
  state: string | null;
  multiplier: number;
  marketTier: 'higher' | 'baseline' | 'lower';
  notes: string;
}

interface ZipStateRange {
  from: number;
  to: number;
  state: string;
}

const ZIP_STATE_RANGES: ZipStateRange[] = [
  { from: 5, to: 5, state: 'NY' },
  { from: 6, to: 9, state: 'PR' },
  { from: 10, to: 27, state: 'MA' },
  { from: 28, to: 29, state: 'RI' },
  { from: 30, to: 38, state: 'NH' },
  { from: 39, to: 49, state: 'ME' },
  { from: 50, to: 59, state: 'VT' },
  { from: 60, to: 69, state: 'CT' },
  { from: 70, to: 89, state: 'NJ' },
  { from: 100, to: 149, state: 'NY' },
  { from: 150, to: 196, state: 'PA' },
  { from: 197, to: 199, state: 'DE' },
  { from: 200, to: 205, state: 'DC' },
  { from: 206, to: 219, state: 'MD' },
  { from: 220, to: 246, state: 'VA' },
  { from: 247, to: 268, state: 'WV' },
  { from: 270, to: 289, state: 'NC' },
  { from: 290, to: 299, state: 'SC' },
  { from: 300, to: 319, state: 'GA' },
  { from: 320, to: 349, state: 'FL' },
  { from: 350, to: 369, state: 'AL' },
  { from: 370, to: 385, state: 'TN' },
  { from: 386, to: 397, state: 'MS' },
  { from: 398, to: 399, state: 'GA' },
  { from: 400, to: 427, state: 'KY' },
  { from: 430, to: 459, state: 'OH' },
  { from: 460, to: 479, state: 'IN' },
  { from: 480, to: 499, state: 'MI' },
  { from: 500, to: 528, state: 'IA' },
  { from: 530, to: 549, state: 'WI' },
  { from: 550, to: 567, state: 'MN' },
  { from: 570, to: 577, state: 'SD' },
  { from: 580, to: 588, state: 'ND' },
  { from: 590, to: 599, state: 'MT' },
  { from: 600, to: 629, state: 'IL' },
  { from: 630, to: 658, state: 'MO' },
  { from: 660, to: 679, state: 'KS' },
  { from: 680, to: 693, state: 'NE' },
  { from: 700, to: 715, state: 'LA' },
  { from: 716, to: 729, state: 'AR' },
  { from: 730, to: 749, state: 'OK' },
  { from: 750, to: 799, state: 'TX' },
  { from: 800, to: 816, state: 'CO' },
  { from: 820, to: 831, state: 'WY' },
  { from: 832, to: 838, state: 'ID' },
  { from: 840, to: 847, state: 'UT' },
  { from: 850, to: 865, state: 'AZ' },
  { from: 870, to: 884, state: 'NM' },
  { from: 889, to: 898, state: 'NV' },
  { from: 900, to: 966, state: 'CA' },
  { from: 967, to: 969, state: 'HI' },
  { from: 970, to: 979, state: 'OR' },
  { from: 980, to: 994, state: 'WA' },
  { from: 995, to: 999, state: 'AK' },
];

const STATE_MULTIPLIERS: Record<string, number> = {
  AK: 1.15,
  AL: 0.9,
  AR: 0.89,
  AZ: 1.0,
  CA: 1.16,
  CO: 1.08,
  CT: 1.11,
  DC: 1.16,
  DE: 1.02,
  FL: 1.02,
  GA: 0.97,
  HI: 1.2,
  IA: 0.9,
  ID: 0.96,
  IL: 1.01,
  IN: 0.92,
  KS: 0.9,
  KY: 0.91,
  LA: 0.92,
  MA: 1.12,
  MD: 1.07,
  ME: 1.01,
  MI: 0.94,
  MN: 0.98,
  MO: 0.92,
  MS: 0.88,
  MT: 0.95,
  NC: 0.97,
  ND: 0.93,
  NE: 0.9,
  NH: 1.02,
  NJ: 1.1,
  NM: 0.92,
  NV: 1.02,
  NY: 1.14,
  OH: 0.94,
  OK: 0.89,
  OR: 1.03,
  PA: 0.99,
  PR: 0.95,
  RI: 1.08,
  SC: 0.93,
  SD: 0.9,
  TN: 0.95,
  TX: 0.99,
  UT: 0.99,
  VA: 1.03,
  VT: 1.0,
  WA: 1.08,
  WI: 0.93,
  WV: 0.88,
  WY: 0.95,
};

const METRO_ADJUSTMENTS: Array<{ name: string; prefixes: number[]; bump: number }> = [
  { name: 'New York City', prefixes: [100, 101, 102, 104, 111, 112, 113], bump: 0.06 },
  { name: 'San Francisco Bay Area', prefixes: [940, 941, 943, 944, 945, 946, 947, 949], bump: 0.06 },
  { name: 'Los Angeles / Orange County', prefixes: [900, 902, 904, 905, 906, 907, 908, 910, 911, 912, 913, 914, 915, 917, 918, 926, 927, 928], bump: 0.04 },
  { name: 'San Diego', prefixes: [919, 920, 921], bump: 0.03 },
  { name: 'Seattle', prefixes: [980, 981], bump: 0.04 },
  { name: 'Boston', prefixes: [20, 21, 22, 23, 24], bump: 0.04 },
  { name: 'Washington, DC core', prefixes: [200, 201, 202, 203, 204, 205], bump: 0.03 },
  { name: 'Miami', prefixes: [330, 331, 332], bump: 0.03 },
  { name: 'Honolulu', prefixes: [967, 968], bump: 0.03 },
  { name: 'Denver metro', prefixes: [800, 801, 802, 803, 804, 805, 806], bump: 0.02 },
];

function normalizeZip(zip: string) {
  return zip.trim().slice(0, 5);
}

function getZipPrefix(zip: string) {
  const normalized = normalizeZip(zip);
  const numeric = Number.parseInt(normalized.slice(0, 3), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveState(prefix: number | null) {
  if (prefix == null) return null;
  const match = ZIP_STATE_RANGES.find((range) => prefix >= range.from && prefix <= range.to);
  return match?.state ?? null;
}

function resolveMetroAdjustment(prefix: number | null) {
  if (prefix == null) return null;
  return METRO_ADJUSTMENTS.find((metro) => metro.prefixes.includes(prefix)) ?? null;
}

export function getRegionalPricingContext(zip: string): RegionalPricingContext {
  const normalizedZip = normalizeZip(zip);
  const prefix = getZipPrefix(zip);
  const state = resolveState(prefix);
  const stateMultiplier = state ? (STATE_MULTIPLIERS[state] ?? 1) : 1;
  const metroAdjustment = resolveMetroAdjustment(prefix);
  const multiplier = Number((stateMultiplier + (metroAdjustment?.bump ?? 0)).toFixed(2));
  const marketTier = multiplier > 1.04 ? 'higher' : multiplier < 0.96 ? 'lower' : 'baseline';

  const notes = metroAdjustment
    ? `ZIP ${normalizedZip} maps to ${state || 'a local market'} with a ${metroAdjustment.name} cost adjustment, using regional multiplier ${multiplier.toFixed(2)}.`
    : state
      ? `ZIP ${normalizedZip} maps to ${state}, using a regional multiplier of ${multiplier.toFixed(2)}.`
      : `ZIP ${normalizedZip} uses a baseline regional multiplier of ${multiplier.toFixed(2)}.`;

  return {
    zip: normalizedZip,
    state,
    multiplier,
    marketTier,
    notes,
  };
}
