import posthog from '@/lib/posthog';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface ServerEventOptions {
  eventName: string;
  homeownerId?: string | null;
  sessionId?: string | null;
  distinctId?: string | null;
  eventData?: Record<string, unknown>;
}

export async function trackServerEvent({ eventName, homeownerId, sessionId, distinctId, eventData = {} }: ServerEventOptions) {
  const resolvedDistinctId = distinctId || homeownerId || sessionId || `server:${eventName}`;

  try {
    await supabaseAdmin.from('analytics_events').insert({
      session_id: sessionId || null,
      homeowner_id: homeownerId || null,
      event_name: eventName,
      event_data: eventData,
    });
  } catch (error) {
    console.warn('analytics_events insert failed', error);
  }

  try {
    posthog.capture({
      distinctId: resolvedDistinctId,
      event: eventName,
      properties: eventData,
    });
  } catch (error) {
    console.warn('posthog capture failed', error);
  }
}

