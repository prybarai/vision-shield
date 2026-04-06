import Link from 'next/link';
import { ArrowRight, Camera, Sparkles, DollarSign, ShieldCheck, Star } from 'lucide-react';
import { PROJECT_CATEGORIES } from '@/types';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-powered home improvement planning
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-balance">
              See what your project could look like — and what it might cost.
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Upload a photo of your space. Prybar gives you a fast estimate, materials list, contractor brief, and optional AI design concepts.
            </p>
            <div className="flex justify-center">
              <Link
                href="/vision/start"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                <Camera className="h-5 w-5" />
                Upload a photo
              </Link>
            </div>
            <p className="text-sm text-slate-400 mt-6">
              Free to start · No credit card required · No calls until you&apos;re ready
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How Prybar Vision works</h2>
            <p className="text-slate-500 text-lg">From idea to estimate in under 5 minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Upload a photo of your space',
                desc: 'Start with one clear photo so Prybar can build your estimate and planning outputs around the real project.',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Choose your project and style',
                desc: 'Pick from 8 project categories and 6 design styles. Tell us your quality tier.',
              },
              {
                step: '03',
                icon: DollarSign,
                title: 'Get estimate + materials + brief',
                desc: 'Get a rough budget estimate, a materials breakdown, a contractor-ready brief, and optional AI concepts.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6">
                  <item.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-blue-600 font-bold text-sm mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">8 project types covered</h2>
            <p className="text-slate-500 text-lg">Interior and exterior — we&apos;ve got you covered</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(PROJECT_CATEGORIES).map(([key, cat]) => (
              <Link
                key={key}
                href="/vision/start"
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-blue-200 transition-all text-center group"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{cat.label}</h3>
                <p className="text-sm text-slate-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                The average homeowner loses <span className="text-red-600">$2,400</span> to contractor scams
              </h2>
              <p className="text-slate-500 text-lg mb-6 leading-relaxed">
                Before you hire, protect yourself. Prybar Shield helps you verify licenses, scan quotes for red flags, and get expert dispute letters — all free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/shield"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Don&apos;t hire blindly
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Project categories', value: '8', icon: Star },
                { label: 'Free to start', value: '$0', icon: DollarSign },
                { label: 'License check speed', value: '<30s', icon: ShieldCheck },
                { label: 'No calls until ready', value: '✓', icon: ShieldCheck },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="h-16 w-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prybar Shield</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Verify contractor licenses, scan quotes for red flags, and get AI-generated dispute letters. Your defense against contractor scams.
          </p>
          <Link
            href="/shield"
            className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Protect yourself for free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
