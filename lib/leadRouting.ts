export interface PrybarRoutingRule {
  contractor_name: string;
  zip_codes?: string[];
  zip_prefixes?: string[];
  trades?: string[];
}

export interface PrybarRoutingMatch {
  contractorName: string;
}

function normalizeZip(zip: string) {
  return zip.replace(/\D/g, '').slice(0, 5);
}

function normalizeTrade(trade: string) {
  return trade.trim().toLowerCase();
}

function parseRules(): PrybarRoutingRule[] {
  const raw = process.env.PRYBAR_ROUTING_RULES;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse PRYBAR_ROUTING_RULES', error);
    return [];
  }
}

export function findPrybarRoutingMatch(zipCode: string, trade: string): PrybarRoutingMatch | null {
  const zip = normalizeZip(zipCode);
  const normalizedTrade = normalizeTrade(trade);

  if (!zip || !normalizedTrade) return null;

  for (const rule of parseRules()) {
    const exactZipMatch = Array.isArray(rule.zip_codes) && rule.zip_codes.some(candidate => normalizeZip(candidate) === zip);
    const prefixMatch = Array.isArray(rule.zip_prefixes) && rule.zip_prefixes.some(prefix => zip.startsWith(prefix.replace(/\D/g, '')));
    const zipMatched = exactZipMatch || prefixMatch;
    const tradeMatched = !Array.isArray(rule.trades) || rule.trades.length === 0
      ? true
      : rule.trades.some(candidate => normalizeTrade(candidate) === normalizedTrade || candidate === '*');

    if (zipMatched && tradeMatched) {
      return { contractorName: rule.contractor_name };
    }
  }

  return null;
}

