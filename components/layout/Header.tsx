'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BriefcaseBusiness, Camera, LayoutGrid, Menu, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/brand/Logo';

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        setSignedIn(Boolean(data.user));
      })
      .catch(() => {
        setSignedIn(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: '/vision', label: 'Vision', icon: Camera },
    { href: '/shield', label: 'Shield', icon: Shield },
    { href: '/for-contractors', label: 'For contractors', icon: BriefcaseBusiness },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  ];

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:h-[74px]">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <Logo showTagline className="gap-2.5" markClassName="h-9 w-10" wordmarkClassName="text-[1.65rem]" />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm md:flex">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-[linear-gradient(135deg,#eef8ff_0%,#f4fde8_100%)] text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? 'text-[#48c7f1]' : '')} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={signedIn ? '/dashboard' : '/auth/login'}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              {signedIn ? 'Dashboard' : 'Sign in'}
            </Link>
            <Link
              href="/vision/start"
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(31,124,247,0.24)] transition-opacity hover:opacity-95"
            >
              {signedIn ? 'New project' : 'Start free'}
            </Link>
          </div>

          <button
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-sm md:hidden">
          <div className="space-y-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-[linear-gradient(135deg,#eef8ff_0%,#f4fde8_100%)] text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            <Link href={signedIn ? '/dashboard' : '/auth/login'} onClick={closeMenu} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              {signedIn ? 'Go to dashboard' : 'Sign in'}
            </Link>
            <Link href="/vision/start" onClick={closeMenu} className="rounded-2xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(31,124,247,0.24)]">
              {signedIn ? 'Start new project' : 'Start free'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
