export interface PrybarLeadPayload {
  source: 'prybar_vision' | 'prybar_shield';
  lead_id: string;
  created_at: string;
  homeowner: { first_name: string; last_name: string; email: string; phone: string; zip_code: string };
  project: { category: string; location_type: 'interior' | 'exterior'; address?: string; style_preference?: string; quality_tier: string; notes?: string };
  context: { generated_image_urls: string[]; uploaded_image_urls: string[]; estimate_range: { low: number; mid: number; high: number }; materials_summary: string; homeowner_goals: string; brief_summary: string; contractor_questions: string[]; risk_scan_completed: boolean; risk_level?: string };
  intent: { preferred_timing: string; budget_range: string; priority: string };
  contractor_acquisition: { send_lead_alert: boolean; service_categories: string[] };
}

async function dispatchWithRetry(payload: PrybarLeadPayload, attempt = 1): Promise<boolean> {
  const webhookUrl = process.env.PRYBAR_CORE_WEBHOOK_URL;
  if (!webhookUrl) { console.warn('PRYBAR_CORE_WEBHOOK_URL not configured'); return false; }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Prybar-Secret': process.env.PRYBAR_CORE_WEBHOOK_SECRET || '' },
      body: JSON.stringify(payload),
    });
    if (response.ok) return true;
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      return dispatchWithRetry(payload, attempt + 1);
    }
    return false;
  } catch {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      return dispatchWithRetry(payload, attempt + 1);
    }
    return false;
  }
}

export async function dispatchLeadToPrybarCore(payload: PrybarLeadPayload): Promise<boolean> {
  return dispatchWithRetry(payload);
}
