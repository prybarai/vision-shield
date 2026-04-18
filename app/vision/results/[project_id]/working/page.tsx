'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  DollarSign, Calendar, CheckCircle, AlertCircle, 
  Home, Ruler, PaintBucket, Download, Share2,
  Loader2, Sparkles, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkingVisionResults() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [projectDescription, setProjectDescription] = useState<string>('');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate loading with timeout
      setTimeout(() => {
        // Mock data for demonstration
        setEstimate({
          low: 8500,
          high: 15000,
          confidence: 'medium',
          breakdown: {
            labor: 6000,
            materials: 4500,
            permits: 1000,
            contingency: 2000
          },
          timeline: {
            min_weeks: 3,
            max_weeks: 6
          }
        });
        
        setProjectDescription('Front yard landscaping with new plants and pathway');
        setProjectImage('/imagery/example-backyard-before.webp');
        setLoading(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-600 bg-emerald-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Analyzing your project</h2>
          <p className="mt-2 text-slate-600">This usually takes 10-20 seconds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={() => router.push('/vision/start')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/vision/start')}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-slate-900">Your Project Estimate</h1>
              <p className="text-sm text-slate-600">AI-powered analysis complete</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">ANALYSIS COMPLETE</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            Your project estimate is ready
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Based on your photo and description
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Image & Overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Image */}
            {projectImage && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={projectImage}
                    alt="Project"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 backdrop-blur-sm">
                    Your project photo
                  </div>
                </div>
                <div className="border-t border-slate-200 p-6">
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">Project Description</h3>
                  <p className="text-slate-700">{projectDescription}</p>
                </div>
              </div>
            )}

            {/* Estimate Card */}
            {estimate && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Estimated Cost Range</h3>
                  <span className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    getConfidenceColor(estimate.confidence)
                  )}>
                    {estimate.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
                
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold text-slate-900">
                    {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
                  </div>
                  <p className="mt-2 text-slate-600">
                    Planning-grade range for budgeting and contractor conversations
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-700">Labor</span>
                      <span className="font-medium text-slate-900">{formatCurrency(estimate.breakdown.labor)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div 
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(estimate.breakdown.labor / estimate.high) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-700">Materials</span>
                      <span className="font-medium text-slate-900">{formatCurrency(estimate.breakdown.materials)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div 
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${(estimate.breakdown.materials / estimate.high) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-700">Permits & Fees</span>
                      <span className="font-medium text-slate-900">{formatCurrency(estimate.breakdown.permits)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div 
                        className="h-full rounded-full bg-amber-600"
                        style={{ width: `${(estimate.breakdown.permits / estimate.high) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-700">Contingency</span>
                      <span className="font-medium text-slate-900">{formatCurrency(estimate.breakdown.contingency)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div 
                        className="h-full rounded-full bg-slate-600"
                        style={{ width: `${(estimate.breakdown.contingency / estimate.high) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-700">Estimated Timeline</span>
                    </div>
                    <span className="font-medium text-slate-900">
                      {estimate.timeline.min_weeks}–{estimate.timeline.max_weeks} weeks
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-8">
            {/* Save & Share */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Save & Share</h3>
              <div className="space-y-3">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
                  <CheckCircle className="h-5 w-5" />
                  Save to My Projects
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                  <Share2 className="h-5 w-5" />
                  Share with Contractor
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                  <Download className="h-5 w-5" />
                  Download PDF Brief
                </button>
              </div>
            </div>

            {/* Next Steps */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Next Steps</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-50 p-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Get contractor quotes</div>
                    <div className="text-sm text-slate-600">Use this estimate to compare bids</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 p-2">
                    <Home className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Review materials</div>
                    <div className="text-sm text-slate-600">Shop for supplies or get quotes</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-50 p-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Plan timeline</div>
                    <div className="text-sm text-slate-600">Schedule work around your availability</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
