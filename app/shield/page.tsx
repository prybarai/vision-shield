import Link from 'next/link';
import { ArrowRight, Search, FileText, LifeBuoy, ShieldCheck } from 'lucide-react';

export default function ShieldPage() {
  const tools = [
    {
      href: '/shield/check',
      icon: Search,
      emoji: '🔍',
      title: 'Check a contractor',
      desc: 'Verify license status, run a risk assessment, and get a contractor questionnaire before you hire.',
      cta: 'Check a contractor',
      color: 'blue',
    },
    {
      href: '/shield/scan',
      icon: FileText,
      emoji: '📄',
      title: 'Scan a quote or contract',
      desc: 'Paste or upload your quote. AI analyzes it for red flags, missing terms, and shady payment structures.',
      cta: 'Scan a document',
      color: 'amber',
    },
    {
      href: '/shield/rescue',
      icon: LifeBuoy,
      emoji: '🆘',
      title: 'Get help — contractor issues',
      desc: 'Contractor ghosted you? Work unfinished? Get AI-generated demand letters, AG complaints, BBB reports, and FTC filings.',
      cta: 'Get help now',
      color: 'red',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <ShieldCheck className="h-4 w-4" />
          Prybar Shield
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Protect yourself from contractor scams
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          The average homeowner loses $2,400 to contractor fraud. Prybar Shield gives you the tools to verify, scan, and fight back — free.
        </p>
      </div>

      {/* Three tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-slate-200 transition-all flex flex-col"
          >
            <div className="text-4xl mb-4">{tool.emoji}</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{tool.title}</h2>
            <p className="text-slate-500 text-sm flex-1 mb-4">{tool.desc}</p>
            <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm">
              {tool.cta} <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-6">Why this matters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { stat: '$2,400', label: 'Average loss from contractor fraud' },
            { stat: '30%', label: 'Of contractors operate without proper licensing' },
            { stat: '< 30s', label: 'Time to run a license check with Prybar' },
          ].map((item) => (
            <div key={item.stat} className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-400 mb-1">{item.stat}</div>
              <div className="text-sm text-slate-300">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
