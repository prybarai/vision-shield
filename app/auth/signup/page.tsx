'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '@/components/brand/Logo';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    else setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] px-4 py-10">
        <div className="mx-auto flex max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfbd2]">
              <CheckCircle className="h-8 w-8 text-[#6db93c]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0d0d1a] mb-2">Check your email</h2>
            <p className="text-slate-500 leading-relaxed">We sent a confirmation link to <strong>{email}</strong>. Once you confirm, your dashboard will be ready.</p>
            <Link href="/vision/start" className="mt-6 inline-block text-sm font-medium text-[#48c7f1] hover:text-[#1f7cf7]">
              Upload a project photo while you wait
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <Logo className="mb-4" markClassName="h-12 w-[3.25rem]" />
          <h1 className="text-3xl font-bold text-[#0d0d1a] mb-3">Create your naili account</h1>
          <p className="text-slate-600 leading-relaxed mb-6">
            Save projects, reopen estimates, and keep your planning and contractor checks in one place.
          </p>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-[#48c7f1]" /><span>Free to start, no credit card required.</span></div>
            <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-[#48c7f1]" /><span>Use shield when you want it, without jumping into contractor calls.</span></div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,124,247,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
          <div className="relative">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Get started</h2>
              <p className="text-sm text-white/70 mt-1">Your account keeps projects, results, and next steps organized.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                hint="At least 8 characters"
                minLength={8}
              />
              {error && <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
              <Button type="submit" className="w-full border-0 bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] shadow-[0_14px_40px_rgba(31,124,247,0.24)] hover:opacity-95" loading={loading}>
                Create account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-white/70">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-white hover:text-[#a8eb57]">Sign in</Link>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-white/55">
              By signing up, you agree to our terms and understand naili provides planning and informational tools, not legal or contractor guarantees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
