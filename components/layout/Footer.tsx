import Link from 'next/link';
import { DISCLAIMERS } from '@/lib/disclaimers';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-white font-bold text-lg">Prybar</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered home project planning and contractor trust verification.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Products</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vision" className="hover:text-white transition-colors">Prybar Vision</Link></li>
              <li><Link href="/shield" className="hover:text-white transition-colors">Prybar Shield</Link></li>
              <li><Link href="/vision/start" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">
            {DISCLAIMERS.global_footer}
          </p>
          <p className="text-xs text-slate-600 mt-3">
            © {new Date().getFullYear()} Prybar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
