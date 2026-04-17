import Link from 'next/link';
import { DISCLAIMERS } from '@/lib/disclaimers';
import Logo from '@/components/brand/Logo';

const PRODUCT_LINKS = [
  { href: '/vision', label: 'naili vision' },
  { href: '/shield', label: 'naili shield' },
  { href: '/for-contractors', label: 'For contractors' },
  { href: '/dashboard', label: 'Dashboard' },
];

const GET_STARTED_LINKS = [
  { href: '/vision/start', label: 'Nail my project' },
  { href: '/auth/signup', label: 'Create account' },
  { href: '/auth/login', label: 'Sign in' },
];

const LEARN_LINKS = [
  { href: '/vision', label: 'How Vision works' },
  { href: '/shield', label: 'How Shield works' },
  { href: '/cost-guides', label: 'Cost guides' },
  { href: '/for-contractors', label: 'How leads work for contractors' },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-[linear-gradient(180deg,#111426_0%,#0b1020_100%)] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-10 grid gap-10 md:grid-cols-[1.2fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <Logo theme="dark" showTagline className="mb-4 gap-2.5" markClassName="h-9 w-10" wordmarkClassName="text-[1.65rem]" taglineClassName="text-slate-400" />
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              naili helps homeowners price a project, build a cleaner brief, and get matched to local pros before the contractor chase starts.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
              Nail the vision. Know the cost.
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Get started</h4>
            <ul className="space-y-2 text-sm">
              {GET_STARTED_LINKS.map((link) => (
                <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Learn</h4>
            <ul className="space-y-2 text-sm">
              {LEARN_LINKS.map((link) => (
                <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">{DISCLAIMERS.global_footer}</p>
          <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 naili. All rights reserved.</p>
            <Link
              href="https://prybar.ai"
              className="font-medium text-[#a8eb57] transition-colors hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Are you a contractor? Try prybar.ai →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
