import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pauseWalkthroughSession, resumeWalkthroughSession } from '@/lib/walkthrough/sessionStore';

const schema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(['pause', 'resume']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const session = params.action === 'pause'
      ? pauseWalkthroughSession(params.sessionId)
      : resumeWalkthroughSession(params.sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('walkthrough status error:', error);
    return NextResponse.json({ error: 'Failed to update walkthrough session status' }, { status: 500 });
  }
}
