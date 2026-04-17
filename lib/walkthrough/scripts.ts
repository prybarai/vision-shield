import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type WalkthroughScript, type WalkthroughTrade } from './types';

const DEFAULT_SCRIPT_VERSION: Record<WalkthroughTrade, string> = {
  interior_paint: 'v1',
};

function scriptFilename(trade: WalkthroughTrade, version: string) {
  return `${trade}.${version}.json`;
}

export async function loadWalkthroughScript(trade: WalkthroughTrade, version?: string): Promise<WalkthroughScript> {
  const resolvedVersion = version || DEFAULT_SCRIPT_VERSION[trade];
  const filePath = path.join(process.cwd(), 'walkthrough-scripts', scriptFilename(trade, resolvedVersion));
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as WalkthroughScript;
}

export function getDefaultWalkthroughVersion(trade: WalkthroughTrade) {
  return DEFAULT_SCRIPT_VERSION[trade];
}
