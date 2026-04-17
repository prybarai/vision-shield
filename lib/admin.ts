import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function getAdminEmails() {
  return (process.env.NAILI_ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!isAdminEmail(user.email)) {
    redirect('/dashboard');
  }

  return user;
}

