'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { LeadStatus } from '@/types';

const VALID_STATUSES: LeadStatus[] = ['new', 'routed_to_prybar', 'outbound', 'converted', 'closed'];

export async function updateLeadQueueEntry(formData: FormData) {
  await requireAdminUser();

  const leadId = String(formData.get('lead_id') || '').trim();
  const status = String(formData.get('status') || '').trim() as LeadStatus;
  const assignedContractor = String(formData.get('assigned_contractor') || '').trim();
  const adminNotes = String(formData.get('admin_notes') || '').trim();

  if (!leadId || !VALID_STATUSES.includes(status)) {
    throw new Error('Invalid lead update');
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .update({
      status,
      assigned_contractor: assignedContractor || null,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) {
    throw new Error(error.message || 'Failed to update lead');
  }

  revalidatePath('/admin/leads');
}

