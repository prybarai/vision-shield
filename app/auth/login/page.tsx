'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-500 leading-relaxed">We sent a magic link to <strong>{email}</strong>. Open it on this device to jump into your dashboard.</p>
          <Link href="/vision/start" className="mt-6 inline-flex text-sm font-medium text-blue-600 hover:underline">
            Start a new project while you wait
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] p-6 sm:p-8 text-white">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 mb-4">
            <span className="text-xl font-bold">P</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome back to Prybar</h1>
          <p className="text-slate-200 leading-relaxed mb-6">
            Reopen saved projects, review estimates, and move into contractor vetting only when you&apos;re ready.
          </p>
          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex items-start gap-2"><Sparkles className="h-4 w-4 mt-0.5 text-blue-200" /><span>Vision results stay organized in one place.</span></div>
            <div className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-blue-200" /><span>Shield tools are ready whenever you want to verify a contractor or quote.</span></div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-slate-500 text-sm mt-1">Use a magic link for the fastest login, or enter your password.</p>
          </div>

          <div className="flex gap-2 mb-6 rounded-2xl bg-slate-100 p-1">
            {(['magic', 'password'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            {mode === 'password' && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            )}
            {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm">{error}</div>}
            <Button type="submit" className="w-full" loading={loading}>
              {mode === 'magic' ? 'Send magic link' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
