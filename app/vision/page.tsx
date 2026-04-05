import Link from 'next/link';
import { ArrowRight, Camera, DollarSign, FileText, Sparkles } from 'lucide-react';
import { PROJECT_CATEGORIES } from '@/types';

export default function VisionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          Prybar Vision
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          See your project before you commit
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
          Upload a photo or enter your address. Our AI generates realistic design concepts, cost estimates, and a full materials list — free.
        </p>
        <Link
          href="/vision/start"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
        >
          <Camera className="h-5 w-5" />
          Start your project
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Camera, title: 'AI Design Concepts', desc: 'Get 3 realistic design renderings for your project style. See what it could look like before spending a dime.' },
          { icon: DollarSign, title: 'Cost Estimate', desc: 'Rough planning estimates based on your ZIP code, quality tier, and project type. No surprises.' },
          { icon: FileText, title: 'Materials List + Brief', desc: 'A complete materials breakdown and contractor-ready project brief you can bring to any quote.' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <f.icon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
            <p className="text-slate-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">8 project types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(PROJECT_CATEGORIES).map(([key, cat]) => (
            <Link
              key={key}
              href="/vision/start"
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all text-center group"
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">{cat.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{cat.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
