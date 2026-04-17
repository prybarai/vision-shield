'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '@/components/brand/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('magic');

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    if (error) setError(error.message);
    else setMagicSent(true);
    setLoading(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else window.location.href = '/dashboard';
    setLoading(false);
  };

  if (magicSent) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] px-4 py-10">
        <div className="mx-auto flex max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfbd2]">
              <CheckCircle className="h-8 w-8 text-[#6db93c]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0d0d1a] mb-2">Check your email</h2>
            <p className="text-slate-500 leading-relaxed">We sent a magic link to <strong>{email}</strong>. Open it on this device to jump into your dashboard.</p>
            <Link href="/vision/start" className="mt-6 inline-flex text-sm font-medium text-[#48c7f1] hover:text-[#1f7cf7]">
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
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,124,247,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
          <div className="relative">
            <Logo theme="dark" className="mb-4" markClassName="h-12 w-[3.25rem]" taglineClassName="text-slate-300" />
            <h1 className="text-3xl font-bold mb-3">Welcome back to naili</h1>
            <p className="text-white/74 leading-relaxed mb-6">
              Reopen saved projects, review estimates, and step back into contractor decisions without losing your place.
            </p>
            <div className="space-y-3 text-sm text-white/78">
              <div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-[#a8eb57]" /><span>Vision results stay organized in one place.</span></div>
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-[#a8eb57]" /><span>Shield tools are ready whenever you want to verify a contractor or quote.</span></div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0d0d1a]">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Use a magic link for the fastest login, or enter your password.</p>
          </div>

          <div className="flex gap-2 rounded-2xl bg-[#f3f4ff] p-1 mb-6">
            {(['magic', 'password'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${mode === m ? 'bg-white text-[#0d0d1a] shadow-sm' : 'text-slate-600 hover:text-[#0d0d1a]'}`}
              >
                {m === 'magic' ? 'Magic link' : 'Password'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            {mode === 'password' && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <Button type="submit" className="w-full border-0 bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] shadow-[0_14px_40px_rgba(31,124,247,0.24)] hover:opacity-95" loading={loading}>
              {mode === 'magic' ? 'Send magic link' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-[#48c7f1] hover:text-[#1f7cf7]">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
