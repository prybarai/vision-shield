'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Camera, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { PROJECT_CATEGORIES, STYLE_OPTIONS, type ProjectCategory, type StylePreference, type QualityTier } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { FALLBACK_VISION_ANALYSIS, type VisionAnalysis } from '@/lib/visionAnalysis';

const STEPS = ['entry', 'category', 'scope', 'style', 'quality', 'loading'] as const;
type Step = typeof STEPS[number];

type ScopeQuestion = {
  key: string;
  label: string;
  helper?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
};

const SCOPE_QUESTIONS: Partial<Record<ProjectCategory, ScopeQuestion[]>> = {
  interior_paint: [
    {
      key: 'room_size',
      label: 'Room size',
      options: [
        { value: 'small', label: 'Small', description: 'Small bedroom or office' },
        { value: 'medium', label: 'Medium', description: 'Standard bedroom or dining room' },
        { value: 'large', label: 'Large', description: 'Living room or open room' },
      ],
    },
    {
      key: 'paint_scope',
      label: 'What are you painting?',
      options: [
        { value: 'walls_only', label: 'Walls only' },
        { value: 'walls_and_ceiling', label: 'Walls + ceiling' },
        { value: 'walls_ceiling_trim', label: 'Walls + ceiling + trim' },
      ],
    },
    {
      key: 'prep_level',
      label: 'Prep needed',
      options: [
        { value: 'light', label: 'Light', description: 'Minor patching, clean walls' },
        { value: 'medium', label: 'Medium', description: 'Some repairs and sanding' },
        { value: 'heavy', label: 'Heavy', description: 'Significant repair or old damage' },
      ],
    },
    {
      key: 'window_coverage',
      label: 'Window coverage',
      options: [
        { value: 'normal_windows', label: 'Normal windows' },
        { value: 'many_windows', label: 'Many windows' },
      ],
    },
  ],
  flooring: [
    {
      key: 'room_size',
      label: 'Room size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    {
      key: 'material_type',
      label: 'Material',
      options: [
        { value: 'lvp', label: 'LVP' },
        { value: 'laminate', label: 'Laminate' },
        { value: 'engineered_hardwood', label: 'Engineered hardwood' },
        { value: 'tile', label: 'Tile' },
      ],
    },
    {
      key: 'demo_required',
      label: 'Remove existing flooring?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  bathroom: [
    {
      key: 'scope_level',
      label: 'Project scope',
      options: [
        { value: 'cosmetic', label: 'Cosmetic' },
        { value: 'mid_refresh', label: 'Mid refresh' },
        { value: 'full_remodel', label: 'Full remodel' },
      ],
    },
    {
      key: 'bathroom_size',
      label: 'Bathroom size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
  ],
  kitchen: [
    {
      key: 'scope_level',
      label: 'Project scope',
      options: [
        { value: 'cosmetic', label: 'Cosmetic' },
        { value: 'mid_refresh', label: 'Mid refresh' },
        { value: 'full_remodel', label: 'Full remodel' },
      ],
    },
    {
      key: 'kitchen_size',
      label: 'Kitchen size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
  ],
  deck_patio: [
    {
      key: 'deck_size',
      label: 'Deck or patio size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    {
      key: 'material_type',
      label: 'Material',
      options: [
        { value: 'pressure_treated', label: 'Pressure treated' },
        { value: 'composite', label: 'Composite' },
        { value: 'cedar_redwood', label: 'Cedar / Redwood' },
      ],
    },
    {
      key: 'railing',
      label: 'Include railing?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  roofing: [
    {
      key: 'roof_size',
      label: 'Roof size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    {
      key: 'material_type',
      label: 'Material',
      options: [
        { value: 'asphalt', label: 'Asphalt' },
        { value: 'architectural_shingle', label: 'Architectural shingle' },
        { value: 'metal', label: 'Metal' },
      ],
    },
    {
      key: 'tear_off',
      label: 'Tear-off required?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
};

const QUALITY_TIERS = [
  {
    value: 'budget' as QualityTier,
    label: 'Budget',
    emoji: '💰',
    desc: 'Cost-effective materials, functional over aesthetic. Great for rentals or flips.',
    modifier: '0.6–0.8x avg cost',
  },
  {
    value: 'mid' as QualityTier,
    label: 'Mid-Range',
    emoji: '⭐',
    desc: 'Good quality materials with a balance of aesthetics and durability.',
    modifier: 'National average',
  },
  {
    value: 'premium' as QualityTier,
    label: 'Premium',
    emoji: '💎',
    desc: 'High-end finishes, top-tier materials, custom options. Built to impress.',
    modifier: '1.4–1.8x avg cost',
  },
];

const PROGRESS_STEPS = [
  'Setting up your project...',
  'Calculating cost estimate...',
  'Building materials list...',
  'Writing contractor brief...',
  'Preparing your results page...',
  'Almost done...',
];

export default function VisionStartFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('entry');
  const [zipCode, setZipCode] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<ProjectCategory | null>(null);
  const [scopeAnswers, setScopeAnswers] = useState<Record<string, string>>({});
  const [style, setStyle] = useState<StylePreference | null>(null);
  const [qualityTier, setQualityTier] = useState<QualityTier>('mid');
  const [notes, setNotes] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const scopeQuestions = category ? SCOPE_QUESTIONS[category] ?? [] : [];
  const hasScopeStep = scopeQuestions.length > 0;
  const visibleSteps = ['entry', 'category', ...(hasScopeStep ? ['scope'] : []), 'style', 'quality'] as Step[];
  const currentVisibleStepIndex = visibleSteps.indexOf(step);
  const allScopeAnswered = scopeQuestions.every(question => Boolean(scopeAnswers[question.key]));

  const handleEntryNext = () => {
    if (!uploadedFile || !zipCode.trim()) return;
    setStep('category');
  };

  const handleCategoryNext = () => {
    if (!category) return;
    setStep(hasScopeStep ? 'scope' : 'style');
  };

  const handleScopeNext = () => {
    if (!allScopeAnswered) return;
    setStep('style');
  };

  const handleStyleNext = () => {
    if (!style) return;
    setStep('quality');
  };

  const updateScopeAnswer = (key: string, value: string) => {
    setScopeAnswers(prev => ({ ...prev, [key]: value }));
  };

  const buildNotesWithScope = (rawNotes: string, answers: Record<string, string>) => {
    const entries = Object.entries(answers).filter(([, value]) => Boolean(value));

    if (entries.length === 0) {
      return rawNotes.length > 0 ? rawNotes : undefined;
    }

    const scopeLines = entries.map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value.replace(/_/g, ' ')}`);
    const scopeBlock = `Scope answers:\n${scopeLines.join('\n')}`;

    return rawNotes.length > 0 ? `${rawNotes}\n\n${scopeBlock}` : scopeBlock;
  };

  const isCustomProject = category === 'custom_project';

  const handleStart = async () => {
    if (!category || !style || !zipCode.trim() || !uploadedFile) {
      setError('Please upload a photo and complete all required fields.');
      return;
    }

    if (isCustomProject && !notes.trim()) {
      setError('Please describe what you want to change before continuing.');
      return;
    }

    setStep('loading');
    setError(null);
    const sessionId = uuidv4();
    const notesWithScope = buildNotesWithScope(notes, scopeAnswers);

    try {
      setProgressStep(0);
      const projectRes = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_type: PROJECT_CATEGORIES[category].type,
          project_category: category,
          zip_code: zipCode.trim(),
          style_preference: style,
          quality_tier: qualityTier,
          notes: notesWithScope,
          session_id: sessionId,
        }),
      });

      if (!projectRes.ok) throw new Error('Failed to create project');
      const { project } = await projectRes.json() as { project: { id: string } };
      const projectId = project.id;

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const uploadRes = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const { url: referenceImageUrl } = await uploadRes.json() as { url: string };

      let analysis: VisionAnalysis = FALLBACK_VISION_ANALYSIS;
      try {
        const analysisRes = await fetch('/api/vision/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: referenceImageUrl,
            category,
            zip_code: zipCode.trim(),
            notes: notesWithScope,
          }),
        });

        if (analysisRes.ok) {
          const data = await analysisRes.json() as { analysis?: VisionAnalysis };
          analysis = data.analysis || FALLBACK_VISION_ANALYSIS;
        }
      } catch (analysisError) {
        console.error('photo analysis failed:', analysisError);
      }

      setProgressStep(1);

      const inferredLocationType = category === 'custom_project' && analysis.suggested_location_type === 'exterior'
        ? 'exterior'
        : PROJECT_CATEGORIES[category].type;
      const estimateRes = await fetch('/api/vision/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category,
          location_type: inferredLocationType,
          style,
          quality_tier: qualityTier,
          zip_code: zipCode.trim(),
          notes: notesWithScope,
          scope_answers: scopeAnswers,
          analysis,
        }),
      });

      if (!estimateRes.ok) throw new Error('Failed to generate estimate');
      const { estimate } = await estimateRes.json() as {
        estimate?: { low_estimate?: number; mid_estimate?: number; high_estimate?: number };
      };

      setProgressStep(2);
      const materialsRes = await fetch('/api/vision/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category,
          style,
          quality_tier: qualityTier,
          estimate_mid: estimate?.mid_estimate || 15000,
          analysis,
          notes: notesWithScope,
        }),
      });

      if (!materialsRes.ok) throw new Error('Failed to generate materials list');

      setProgressStep(3);
      const briefRes = await fetch('/api/vision/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category,
          style,
          quality_tier: qualityTier,
          notes: notesWithScope,
          estimate_low: estimate?.low_estimate || 10000,
          estimate_high: estimate?.high_estimate || 20000,
          analysis,
        }),
      });

      if (!briefRes.ok) throw new Error('Failed to generate project brief');

      setProgressStep(4);
      await fetch('/api/vision/generate-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category,
          style,
          quality_tier: qualityTier,
          notes: notesWithScope,
          reference_image_url: referenceImageUrl,
          analysis,
          count: 1,
        }),
      }).catch((conceptError) => {
        console.error('concept generation failed:', conceptError);
      });

      setProgressStep(5);
      await new Promise(r => setTimeout(r, 800));
      router.push(`/vision/results/${projectId}`);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setStep('quality');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      {step !== 'loading' && (
        <div className="flex items-center justify-center gap-2 mb-10">
          {visibleSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  currentVisibleStepIndex > i
                    ? 'bg-blue-600 text-white'
                    : currentVisibleStepIndex === i
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {currentVisibleStepIndex > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < visibleSteps.length - 1 && (
                <div className={cn('h-0.5 w-12', currentVisibleStepIndex > i ? 'bg-blue-600' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>
      )}

      {step === 'entry' && (
        <div>
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Upload a photo of your space</h1>
          <p className="text-slate-500 text-center mb-8">Add one clear photo and your ZIP code to get a fast estimate, materials list, and project brief.</p>

          <Card className="mb-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
              )}
            >
              <input {...getInputProps()} />
              {uploadPreview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadPreview} alt="Upload preview" className="max-h-48 mx-auto rounded-lg mb-3" />
                  <p className="text-sm text-slate-500">{uploadedFile?.name}</p>
                </div>
              ) : (
                <>
                  <Camera className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Drag & drop or click to upload</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
                </>
              )}
            </div>
            <div className="mt-4">
              <Input
                label="ZIP code"
                placeholder="10001"
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                required
              />
            </div>
          </Card>

          <Button className="w-full" size="lg" onClick={handleEntryNext} disabled={!uploadedFile || !zipCode.trim()}>
            Continue
          </Button>
        </div>
      )}

      {step === 'category' && (
        <div>
          <button onClick={() => setStep('entry')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">What&apos;s your project?</h1>
          <p className="text-slate-500 text-center mb-8">Choose the project type you&apos;re planning.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {(Object.entries(PROJECT_CATEGORIES) as [ProjectCategory, typeof PROJECT_CATEGORIES[ProjectCategory]][]).map(([key, cat]) => (
              <Card
                key={key}
                hover
                selected={category === key}
                onClick={() => {
                  setCategory(key);
                  setScopeAnswers({});
                }}
                className="text-center cursor-pointer p-4"
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <div className="font-semibold text-slate-900 text-sm">{cat.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{cat.description}</div>
              </Card>
            ))}
          </div>

          <Button className="w-full" size="lg" onClick={handleCategoryNext} disabled={!category}>
            Continue
          </Button>
        </div>
      )}

      {step === 'scope' && category && (
        <div>
          <button onClick={() => setStep('category')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">A few quick scope details</h1>
          <p className="text-slate-500 text-center mb-8">These answers make the estimate more grounded than a broad benchmark.</p>

          <div className="space-y-6 mb-8">
            {scopeQuestions.map((question) => (
              <div key={question.key}>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">{question.label}</h3>
                  {question.helper && <p className="text-sm text-slate-500 mt-1">{question.helper}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {question.options.map((option) => (
                    <Card
                      key={option.value}
                      hover
                      selected={scopeAnswers[question.key] === option.value}
                      onClick={() => updateScopeAnswer(question.key, option.value)}
                      className="cursor-pointer p-4"
                    >
                      <div className="font-semibold text-slate-900">{option.label}</div>
                      {option.description && <div className="text-xs text-slate-500 mt-1">{option.description}</div>}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" size="lg" onClick={handleScopeNext} disabled={!allScopeAnswered}>
            Continue
          </Button>
        </div>
      )}

      {step === 'style' && (
        <div>
          <button onClick={() => setStep(hasScopeStep ? 'scope' : 'category')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Choose your style</h1>
          <p className="text-slate-500 text-center mb-8">This guides the AI concept generation.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {(Object.entries(STYLE_OPTIONS) as [StylePreference, typeof STYLE_OPTIONS[StylePreference]][]).map(([key, opt]) => (
              <Card
                key={key}
                hover
                selected={style === key}
                onClick={() => setStyle(key)}
                className="cursor-pointer p-4"
              >
                <div className="w-6 h-6 rounded-full mb-2" style={{ background: opt.color }} />
                <div className="font-semibold text-slate-900">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
              </Card>
            ))}
          </div>

          <Button className="w-full" size="lg" onClick={handleStyleNext} disabled={!style}>
            Continue
          </Button>
        </div>
      )}

      {step === 'quality' && (
        <div>
          <button onClick={() => setStep('style')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Budget or premium?</h1>
          <p className="text-slate-500 text-center mb-8">Sets the quality tier for materials and estimate. Planning outputs come first; concepts are optional.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {QUALITY_TIERS.map((tier) => (
              <Card
                key={tier.value}
                hover
                selected={qualityTier === tier.value}
                onClick={() => setQualityTier(tier.value)}
                className="cursor-pointer"
              >
                <div className="text-2xl mb-2">{tier.emoji}</div>
                <div className="font-bold text-slate-900 text-lg mb-1">{tier.label}</div>
                <div className="text-sm text-slate-500 mb-3">{tier.desc}</div>
                <div className="text-xs font-medium text-blue-600 bg-blue-50 rounded-lg px-2 py-1 inline-block">{tier.modifier}</div>
              </Card>
            ))}
          </div>

          <Card className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isCustomProject ? 'Describe what you want to change' : 'Any specific notes?'}{' '}
              {!isCustomProject && <span className="text-slate-400">(optional)</span>}
            </label>
            {isCustomProject && (
              <p className="text-sm text-slate-500 mb-2">
                Tell Prybar what you&apos;re hoping to update, repair, redesign, or add. The more specific you are, the better the estimate and contractor brief will be.
              </p>
            )}
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={isCustomProject ? 4 : 3}
              placeholder={isCustomProject ? 'e.g. Replace the old pergola with a covered outdoor kitchen and add better lighting near the patio.' : 'e.g. We have a dog, need to avoid hardwood. Current counters are laminate.'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Card>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}

          <Button className="w-full" size="lg" onClick={handleStart} disabled={isCustomProject && !notes.trim()}>
            Generate my project ✨
          </Button>
        </div>
      )}

      {step === 'loading' && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-8">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Building your project...</h2>
          <p className="text-slate-500 mb-10">We&apos;re generating your estimate, materials list, and contractor brief first. Design concepts may take a little longer.</p>

          <div className="max-w-sm mx-auto space-y-3">
            {PROGRESS_STEPS.map((label, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all',
                  i < progressStep ? 'opacity-50' : i === progressStep ? 'bg-blue-50 text-blue-700 font-medium' : 'opacity-30'
                )}
              >
                {i < progressStep ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : i === progressStep ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
