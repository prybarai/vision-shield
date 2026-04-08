import Link from 'next/link';
import { DISCLAIMERS } from '@/lib/disclaimers';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr] mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-none">Prybar</div>
                <div className="text-xs text-slate-500 mt-1">Plan first, hire smarter</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-md text-slate-400">
              Prybar helps homeowners turn a photo into a clearer project plan, then pressure-test contractor trust before money or signatures move.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vision" className="hover:text-white transition-colors">Vision</Link></li>
              <li><Link href="/shield" className="hover:text-white transition-colors">Shield</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Get started</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vision/start" className="hover:text-white transition-colors">Start with a photo</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Create account</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 space-y-3">
          <p className="text-xs leading-relaxed text-slate-500">
            {DISCLAIMERS.global_footer}
          </p>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Prybar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
