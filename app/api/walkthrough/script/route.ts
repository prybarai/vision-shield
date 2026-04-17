import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildConfirmSummary, createWalkthroughState, getWalkthroughNode, getWalkthroughProgress } from '@/lib/walkthrough/engine';
import { getDefaultWalkthroughVersion, loadWalkthroughScript } from '@/lib/walkthrough/scripts';
import { type WalkthroughTrade } from '@/lib/walkthrough/types';

const schema = z.object({
  trade: z.enum(['interior_paint']),
  version: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = schema.parse({
      trade: url.searchParams.get('trade'),
      version: url.searchParams.get('version') || undefined,
    });

    const script = await loadWalkthroughScript(params.trade as WalkthroughTrade, params.version);
    const state = createWalkthroughState(script);
    const currentNode = getWalkthroughNode(script, state.currentNodeId);

    return NextResponse.json({
      script: {
        id: script.id,
        trade: script.trade,
        version: script.version,
        label: script.label,
        intro: script.intro,
        startNodeId: script.startNodeId,
        completionNodeId: script.completionNodeId,
        nodeCount: script.nodes.length,
        defaultVersion: getDefaultWalkthroughVersion(script.trade),
      },
      state,
      currentNode,
      progress: getWalkthroughProgress(script, state),
      confirmSummary: buildConfirmSummary(script, state),
    });
  } catch (error) {
    console.error('walkthrough script route error:', error);
    return NextResponse.json({ error: 'Failed to load walkthrough script' }, { status: 500 });
  }
}
