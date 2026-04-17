import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createWalkthroughSession, getWalkthroughSession } from '@/lib/walkthrough/sessionStore';

const createSchema = z.object({
  trade: z.enum(['interior_paint']),
  version: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const session = getWalkthroughSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = createSchema.parse(body);
    const session = await createWalkthroughSession(params);
    return NextResponse.json(session);
  } catch (error) {
    console.error('walkthrough session create error:', error);
    return NextResponse.json({ error: 'Failed to create walkthrough session' }, { status: 500 });
  }
}
