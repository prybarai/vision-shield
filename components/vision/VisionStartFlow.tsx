'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Camera, CheckCircle, Loader2, Upload, ArrowLeft } from 'lucide-react';
import { PROJECT_CATEGORIES, STYLE_OPTIONS, type ProjectCategory, type StylePreference, type QualityTier } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const STEPS = ['entry', 'category', 'style', 'quality', 'loading'] as const;
type Step = typeof STEPS[number];

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

  const handleEntryNext = () => {
    if (!uploadedFile || !zipCode.trim()) return;
    setStep('category');
  };

  const handleCategoryNext = () => {
    if (!category) return;
    setStep('style');
  };

  const handleStyleNext = () => {
    if (!style) return;
    setStep('quality');
  };

  const handleStart = async () => {
    if (!category || !style || !zipCode.trim() || !uploadedFile) {
      setError('Please upload a photo and complete all required fields.');
      return;
    }

    setStep('loading');
    setError(null);
    const sessionId = uuidv4();

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
          notes: notes || undefined,
          session_id: sessionId,
        }),
      });

      if (!projectRes.ok) throw new Error('Failed to create project');
      const { project } = await projectRes.json() as { project: { id: string } };
      const projectId = project.id;

      let referenceImageUrl: string | undefined;
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const uploadRes = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const { url } = await uploadRes.json() as { url: string };
      referenceImageUrl = url;

      setProgressStep(1);
      const estimateRes = await fetch('/api/vision/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category,
          location_type: PROJECT_CATEGORIES[category].type,
          style,
          quality_tier: qualityTier,
          zip_code: zipCode.trim(),
          notes: notes || undefined,
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
          notes: notes || undefined,
          estimate_low: estimate?.low_estimate || 10000,
          estimate_high: estimate?.high_estimate || 20000,
        }),
      });

      if (!briefRes.ok) throw new Error('Failed to generate project brief');

      setProgressStep(4);
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
          {(['entry', 'category', 'style', 'quality'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  STEPS.indexOf(step) > i
                    ? 'bg-blue-600 text-white'
                    : STEPS.indexOf(step) === i
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {STEPS.indexOf(step) > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < 3 && <div className={cn('h-0.5 w-12', STEPS.indexOf(step) > i ? 'bg-blue-600' : 'bg-slate-200')} />}
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(Object.entries(PROJECT_CATEGORIES) as [ProjectCategory, typeof PROJECT_CATEGORIES[ProjectCategory]][]).map(([key, cat]) => (
              <Card
                key={key}
                hover
                selected={category === key}
                onClick={() => setCategory(key)}
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

      {step === 'style' && (
        <div>
          <button onClick={() => setStep('category')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
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
              Any specific notes? <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="e.g. We have a dog, need to avoid hardwood. Current counters are laminate."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Card>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}

          <Button className="w-full" size="lg" onClick={handleStart}>
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
