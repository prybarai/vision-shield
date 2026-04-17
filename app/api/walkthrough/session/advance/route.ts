import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { advanceWalkthroughSession } from '@/lib/walkthrough/sessionStore';

const schema = z.object({
  sessionId: z.string().uuid(),
  input: z.object({
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number(), z.boolean()])), z.null()]).optional(),
    summary: z.string().optional(),
    measurementValue: z.number().optional(),
    signals: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number(), z.boolean()])), z.null()])
    ).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    const session = await advanceWalkthroughSession(params.sessionId, params.input || {});

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('walkthrough advance error:', error);
    return NextResponse.json({ error: 'Failed to advance walkthrough session' }, { status: 500 });
  }
}
