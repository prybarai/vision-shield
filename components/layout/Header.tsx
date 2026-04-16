'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Camera, LayoutGrid, Menu, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  ];

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-4">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-slate-900 leading-none">Naili</div>
              <div className="hidden sm:block text-xs text-slate-500 leading-none mt-1">Nail the vision. Know the cost.</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href={signedIn ? '/dashboard' : '/auth/login'}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {signedIn ? 'Dashboard' : 'Sign in'}
            </Link>
            <Link
              href="/vision/start"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              {signedIn ? 'New project' : 'Start free'}
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-sm">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors w-full',
                pathname.startsWith(href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-slate-100 pt-3 mt-3 flex flex-col gap-2">
            <Link href={signedIn ? '/dashboard' : '/auth/login'} onClick={closeMenu} className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-2xl">
              {signedIn ? 'Go to dashboard' : 'Sign in'}
            </Link>
            <Link href="/vision/start" onClick={closeMenu} className="bg-blue-600 text-white text-sm font-semibold px-4 py-3 rounded-2xl text-center">
              {signedIn ? 'Start new project' : 'Start free'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
