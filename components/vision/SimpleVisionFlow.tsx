'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle, Loader2, Home, Palette, DollarSign, ClipboardList } from 'lucide-react';
import Button from '@/components/ui/Button';

const PROJECT_CATEGORIES = [
  { key: 'interior_paint', label: 'Paint a room', icon: '🎨', color: 'bg-blue-100 text-blue-700' },
  { key: 'bathroom', label: 'Bathroom refresh', icon: '🚿', color: 'bg-teal-100 text-teal-700' },
  { key: 'kitchen', label: 'Kitchen update', icon: '🍳', color: 'bg-amber-100 text-amber-700' },
  { key: 'flooring', label: 'New flooring', icon: '🪵', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'deck_patio', label: 'Deck or patio', icon: '🌿', color: 'bg-green-100 text-green-700' },
  { key: 'landscaping', label: 'Landscaping', icon: '🌳', color: 'bg-lime-100 text-lime-700' },
  { key: 'custom_project', label: 'Something else', icon: '✨', color: 'bg-purple-100 text-purple-700' },
];

const STYLE_OPTIONS = [
  { key: 'modern', label: 'Modern', desc: 'Clean lines, minimal' },
  { key: 'transitional', label: 'Transitional', desc: 'Balanced blend' },
  { key: 'traditional', label: 'Traditional', desc: 'Classic, timeless' },
  { key: 'coastal', label: 'Coastal', desc: 'Light, airy, relaxed' },
  { key: 'industrial', label: 'Industrial', desc: 'Raw, urban' },
  { key: 'scandinavian', label: 'Scandinavian', desc: 'Warm minimalism' },
];

const QUALITY_TIERS = [
  { key: 'budget', label: 'Budget', desc: 'Basic materials, cost-effective', price: '$$' },
  { key: 'mid', label: 'Mid-range', desc: 'Good quality, balanced price', price: '$$$' },
  { key: 'premium', label: 'Premium', desc: 'High-end materials, best results', price: '$$$$' },
];

type Step = 'category' | 'style' | 'quality' | 'notes' | 'generating';

type PageProps = {
  initialPrefill?: {
    from?: string;
    zip?: string;
    category?: string;
    style?: string;
    quality?: string;
    notes?: string;
    image?: string;
  };
};

export default function SimpleVisionFlow({ initialPrefill }: PageProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<string>(initialPrefill?.category || '');
  const [style, setStyle] = useState<string>(initialPrefill?.style || 'modern');
  const [quality, setQuality] = useState<string>(initialPrefill?.quality || 'mid');
  const [notes, setNotes] = useState<string>(initialPrefill?.notes || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectId, setProjectId] = useState<string>(initialPrefill?.from || '');

  useEffect(() => {
    if (initialPrefill?.category) {
      setCategory(initialPrefill.category);
    }
    if (initialPrefill?.style) {
      setStyle(initialPrefill.style);
    }
    if (initialPrefill?.quality) {
      setQuality(initialPrefill.quality);
    }
    if (initialPrefill?.notes) {
      setNotes(initialPrefill.notes);
    }
    if (initialPrefill?.from) {
      setProjectId(initialPrefill.from);
    }
  }, [initialPrefill]);

  const handleNext = () => {
    if (step === 'category') setStep('style');
    else if (step === 'style') setStep('quality');
    else if (step === 'quality') setStep('notes');
    else if (step === 'notes') handleGenerate();
  };

  const handleBack = () => {
    if (step === 'style') setStep('category');
    else if (step === 'quality') setStep('style');
    else if (step === 'notes') setStep('quality');
  };

  const handleGenerate = async () => {
    if (!category) {
      alert('Please select a project type');
      return;
    }

    setIsGenerating(true);

    try {
      // First, get the project to get image URL and ZIP code
      const projectResponse = await fetch(`/api/projects/get?id=${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project details');
      }
      const { project } = await projectResponse.json();
      
      // Get the first uploaded image URL
      const imageUrl = project.uploaded_image_urls?.[0];
      if (!imageUrl) {
        throw new Error('No image found for this project');
      }

      // Update project with user selections
      const updateResponse = await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          project_category: category,
          style_preference: style,
          quality_tier: quality,
          notes: notes,
          status: 'ai_processing',
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update project');
      }

      // Start AI analysis with all required parameters
      const analysisResponse = await fetch('/api/vision/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          category: category,
          zip_code: project.zip_code || '10001', // Default if missing
          notes: notes,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to start AI analysis');
      }

      // Redirect to results page
      router.push(`/vision/results/${projectId}`);

    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'category':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of project?</h2>
              <p className="text-gray-600">Select the category that best matches your goal</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PROJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    category === cat.key
                      ? 'border-sand-dark bg-sand/10 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className={`text-sm font-semibold ${cat.color}`}>{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferred style?</h2>
              <p className="text-gray-600">Choose the aesthetic you're aiming for</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {STYLE_OPTIONS.map((styleOption) => (
                <button
                  key={styleOption.key}
                  onClick={() => setStyle(styleOption.key)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    style === styleOption.key
                      ? 'border-sand-dark bg-sand/10 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900">{styleOption.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{styleOption.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'quality':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quality level?</h2>
              <p className="text-gray-600">Choose your budget and quality preference</p>
            </div>
            
            <div className="space-y-4">
              {QUALITY_TIERS.map((tier) => (
                <button
                  key={tier.key}
                  onClick={() => setQuality(tier.key)}
                  className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                    quality === tier.key
                      ? 'border-sand-dark bg-sand/10 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">{tier.label}</span>
                    <span className="text-lg font-bold text-gray-700">{tier.price}</span>
                  </div>
                  <p className="text-sm text-gray-600">{tier.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Any specific notes?</h2>
              <p className="text-gray-600">Optional: Add details about what you want to achieve</p>
            </div>
            
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., 'I want to make the room feel brighter' or 'Need to fix water damage in corner'"
                className="w-full h-40 rounded-2xl border-2 border-gray-200 p-4 text-gray-900 placeholder-gray-400 focus:border-sand focus:outline-none focus:ring-2 focus:ring-sand/30 resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">Leave blank if you're not sure</p>
            </div>
          </div>
        );

      case 'generating':
        return (
          <div className="space-y-8 text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 mb-6">
              <Loader2 className="h-10 w-10 text-sand-dark animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AI is analyzing your project</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Our AI is examining your photo, creating a detailed plan with estimates, materials, and visual concepts.
            </p>
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Analyzing photo and space layout</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Calculating material requirements</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Generating cost estimates</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Loader2 className="h-5 w-5 text-sand-dark animate-spin flex-shrink-0" />
                <span className="text-sm text-gray-700">Creating visual concepts</span>
              </div>
            </div>
          </div>
        );
    }
  };

  const progressSteps = [
    { key: 'category', label: 'Project Type' },
    { key: 'style', label: 'Style' },
    { key: 'quality', label: 'Quality' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      {step !== 'generating' && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {progressSteps.map((progressStep, index) => (
              <div key={progressStep.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step === progressStep.key
                      ? 'bg-sand-dark text-white'
                      : index < progressSteps.findIndex(s => s.key === step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < progressSteps.findIndex(s => s.key === step) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700">{progressStep.label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sand to-sand-dark transition-all duration-500"
              style={{
                width: `${((progressSteps.findIndex(s => s.key === step) + 1) / progressSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
        {renderStep()}

        {/* Navigation buttons */}
        {step !== 'generating' && (
          <div className="flex justify-between mt-10 pt-8 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={step === 'category'}
              className={`px-6 py-3 rounded-xl font-medium ${
                step === 'category'
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
            
            <Button
              onClick={handleNext}
              disabled={(step === 'category' && !category) || isGenerating}
              className="px-8 py-3 text-lg font-semibold"
            >
              {step === 'notes' ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate AI Plan
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* What you'll get section */}
      {step !== 'generating' && (
        <div className="mt-10 bg-gradient-to-r from-sand/10 to-mint/10 rounded-3xl p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get from this:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Space Analysis</span>
              </div>
              <p className="text-sm text-gray-600">AI examines layout, materials, and condition</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <span className="font-semibold text-gray-900">Cost Estimate</span>
              </div>
              <p className="text-sm text-gray-600">Realistic pricing based on your location</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-gray-900">Materials List</span>
              </div>
              <p className="text-sm text-gray-600">Specific items needed for your project</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-semibold text-gray-900">Visual Concepts</span>
              </div>
              <p className="text-sm text-gray-600">AI-generated images showing potential results</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
