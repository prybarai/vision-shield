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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-500 leading-relaxed">We sent a confirmation link to <strong>{email}</strong>. Once you confirm, your dashboard will be ready.</p>
          <Link href="/vision/start" className="mt-6 inline-block text-blue-600 hover:underline text-sm font-medium">
            Start a project while you wait
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-[2rem] bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <Logo className="mb-4" markClassName="h-12 w-[3.25rem]" />
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Create your naili account</h1>
          <p className="text-slate-600 leading-relaxed mb-6">
            Save projects, reopen estimates, and keep your planning and contractor trust tools in one place.
          </p>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2"><Sparkles className="h-4 w-4 mt-0.5 text-blue-600" /><span>Free to start, no credit card required.</span></div>
            <div className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-blue-600" /><span>Use Shield when you want it, without jumping into contractor calls.</span></div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Get started</h2>
            <p className="text-slate-500 text-sm mt-1">Your account keeps projects, results, and next steps organized.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              hint="At least 8 characters"
              minLength={8}
            />
            {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm">{error}</div>}
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
            By signing up, you agree to our terms and understand naili provides planning and informational tools, not legal or contractor guarantees.
          </p>
        </div>
      </div>
    </div>
  );
}
