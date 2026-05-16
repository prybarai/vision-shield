'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, UserPlus, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import Nav from '@/components/Nav';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Try to sign in immediately (works if email confirmation is disabled)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!signInError) {
      router.push(redirect);
      router.refresh();
    } else {
      // Email confirmation required
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md px-4 sm:px-0 text-center">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Check your email</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-stone-500">
            We sent a confirmation link to <strong className="text-stone-700">{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-stone-900 active:scale-95"
          >
            Back to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-200 to-stone-100">
          <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-800">Create your account</h1>
        <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-stone-500">Save your designs and access them from anywhere.</p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-4 sm:mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 transition focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pr-11 text-base text-stone-800 placeholder:text-stone-400 transition focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-stone-700">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 transition focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-stone-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </>
            ) : (
              <>
                Create account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-sm text-stone-500">
            Already have an account?{' '}
            <Link
              href={`/auth/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-semibold text-stone-700 hover:text-stone-900 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-5 sm:mt-6 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <p className="mb-2.5 sm:mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">What you get</p>
        <ul className="space-y-2 text-sm text-stone-600">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            Save unlimited renovation designs
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            Access your projects from any device
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            Share plans with contractors instantly
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <Nav />
      <section className="flex items-center justify-center px-0 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-28 md:pt-32">
        <Suspense fallback={
          <div className="w-full max-w-md text-center py-16">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
          </div>
        }>
          <SignupForm />
        </Suspense>
      </section>
    </main>
  );
}
