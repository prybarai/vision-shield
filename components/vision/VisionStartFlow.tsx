'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, type FileRejection } from 'react-dropzone';
import {
  ArrowLeft,
  CheckCircle,
  ImagePlus,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { PROJECT_CATEGORIES, STYLE_OPTIONS, type ProjectCategory, type StylePreference, type QualityTier } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { buildLoadingObservations, FALLBACK_VISION_ANALYSIS, type VisionAnalysis } from '@/lib/visionAnalysis';
import posthog from 'posthog-js';

type Step = 'entry' | 'category' | 'scope' | 'style' | 'quality' | 'loading';

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

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const SUPPORTED_IMAGE_LABEL = 'JPG, PNG, or WEBP up to 10MB';

async function readApiError(response: Response, fallback: string) {
  try {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json() as { error?: string; message?: string };
      const message = data.error || data.message;
      if (message?.trim()) return message.trim();
      return fallback;
    }

    const text = (await response.text()).trim();
    return text.length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
}

function getFileRejectionMessage(rejections: FileRejection[]) {
  const firstError = rejections[0]?.errors[0];

  if (!firstError) {
    return `Please upload a supported image, ${SUPPORTED_IMAGE_LABEL}.`;
  }

  if (firstError.code === 'file-too-large') {
    return 'That photo is too large. Please use an image under 10MB.';
  }

  if (firstError.code === 'file-invalid-type') {
    return `That photo format is not supported yet. Please use ${SUPPORTED_IMAGE_LABEL}.`;
  }

  if (firstError.code === 'too-many-files') {
    return 'Please upload just one photo.';
  }

  return firstError.message || `Please upload a supported image, ${SUPPORTED_IMAGE_LABEL}.`;
}

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
    desc: 'Cost-conscious materials and simpler finishes, good for rentals, resale prep, or quick cleanups.',
    modifier: 'Typically 0.6–0.8x average',
  },
  {
    value: 'mid' as QualityTier,
    label: 'Mid-range',
    emoji: '⭐',
    desc: 'The safest default for most homeowners, balancing durability, looks, and resale value.',
    modifier: 'Typically around average market pricing',
  },
  {
    value: 'premium' as QualityTier,
    label: 'Premium',
    emoji: '💎',
    desc: 'Higher-end finishes, more custom detailing, and upgraded materials where aesthetics matter more.',
    modifier: 'Typically 1.4–1.8x average',
  },
];

const PROGRESS_STEPS = [
  'Reading your photo and request...',
  'Building your local cost range...',
  'Drafting your materials plan...',
  'Writing your contractor brief...',
  'Rendering your first design concept...',
  'Finalizing your plan...',
];

const PHOTO_TIPS = [
  'Use one straight-on photo with good lighting',
  'Include as much of the space as you can in frame',
  'Avoid heavy filters, screenshots, or blurry images',
];

export default function VisionStartFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('entry');
  const [zipCode, setZipCode] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<ProjectCategory | null>(null);
  const [scopeAnswers, setScopeAnswers] = useState<Record<string, string>>({});
  const [style, setStyle] = useState<StylePreference>('modern');
  const [qualityTier, setQualityTier] = useState<QualityTier>('mid');
  const [notes, setNotes] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [analysisHighlights, setAnalysisHighlights] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setError(`That photo format is not supported yet. Please use ${SUPPORTED_IMAGE_LABEL}.`);
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setError('That photo is too large. Please use an image under 10MB.');
        return;
      }

      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
      setError(null);
      posthog.capture('naili_photo_uploaded', {
        file_type: file.type,
        file_size: file.size,
      });
    }
  }, [uploadPreview]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    setError(getFileRejectionMessage(rejections));
  }, []);

  const removeUpload = () => {
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadedFile(null);
    setUploadPreview(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
  });

  const scopeQuestions = category ? SCOPE_QUESTIONS[category] ?? [] : [];
  const hasScopeStep = scopeQuestions.length > 0;
  const visibleSteps = ['entry', 'category', ...(hasScopeStep ? ['scope'] : []), 'style', 'quality'] as Step[];
  const currentVisibleStepIndex = visibleSteps.indexOf(step);
  const allScopeAnswered = scopeQuestions.every(question => Boolean(scopeAnswers[question.key]));

  const handleEntryNext = () => {
    if (!uploadedFile || !zipCode.trim()) return;
    setError(null);
    setStep('category');
  };

  const handleCategoryNext = () => {
    if (!category) return;
    setError(null);
    setStep(hasScopeStep ? 'scope' : 'style');
  };

  const handleScopeNext = () => {
    if (!allScopeAnswered) return;
    setError(null);
    setStep('style');
  };

  const handleStyleNext = () => {
    if (!style) return;
    setError(null);
    setStep('quality');
  };

  const handleScopeSkip = () => {
    setError(null);
    setStep('style');
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
      setError('Please upload a photo and complete the required steps.');
      return;
    }

    if (isCustomProject && !notes.trim()) {
      setError('Please describe the custom project before continuing.');
      return;
    }

    setStep('loading');
    setError(null);
    setAnalysisHighlights([]);
    const sessionId = uuidv4();
    const notesWithScope = buildNotesWithScope(notes, scopeAnswers);
    let recoveryStep: Step = 'quality';

    try {
      if (notesWithScope) {
        posthog.capture('naili_prompt_entered', {
          category,
          has_scope_answers: Object.keys(scopeAnswers).length > 0,
          is_custom_project: isCustomProject,
        });
      }

      posthog.capture('naili_generation_started', {
        category,
        style,
        quality_tier: qualityTier,
        has_scope_questions: hasScopeStep,
        has_scope_answers: Object.keys(scopeAnswers).length > 0,
        is_custom_project: isCustomProject,
      });

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

      if (!projectRes.ok) throw new Error(await readApiError(projectRes, 'We could not set up your project. Please try again.'));
      recoveryStep = 'entry';
      const { project } = await projectRes.json() as { project: { id: string } };
      const projectId = project.id;

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const uploadRes = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error(await readApiError(uploadRes, `We could not upload that photo. Please use ${SUPPORTED_IMAGE_LABEL}.`));
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
          setAnalysisHighlights(buildLoadingObservations(analysis));
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

      if (!estimateRes.ok) throw new Error(await readApiError(estimateRes, 'We could not build your estimate yet. Please try again.'));
      const { estimate } = await estimateRes.json() as {
        estimate?: { low_estimate?: number; mid_estimate?: number; high_estimate?: number };
      };

      setProgressStep(2);
      const materialsPromise = fetch('/api/vision/materials', {
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

      setProgressStep(3);
      const briefPromise = fetch('/api/vision/brief', {
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

      const conceptPromise = (async () => {
        try {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 15000);

          const conceptsRes = await fetch('/api/vision/generate-concepts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
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
          });

          window.clearTimeout(timeout);

          if (!conceptsRes.ok) {
            throw new Error(`Concept generation returned ${conceptsRes.status}`);
          }
        } catch (conceptError) {
          console.error('Concept generation failed', conceptError);
        }
      })();

      const [materialsRes, briefRes] = await Promise.all([materialsPromise, briefPromise]);

      if (!materialsRes.ok) throw new Error(await readApiError(materialsRes, 'We could not build your materials list yet. Please try again.'));

      if (!briefRes.ok) throw new Error(await readApiError(briefRes, 'We could not build your contractor brief yet. Please try again.'));

      setProgressStep(4);
      await conceptPromise;

      setProgressStep(5);

      posthog.capture('naili_generation_completed', {
        category,
        style,
        quality_tier: qualityTier,
        project_id: projectId,
      });

      await new Promise(r => setTimeout(r, 700));
      router.push(`/vision/results/${projectId}`);
    } catch (err) {
      console.error(err);
      posthog.capture('naili_generation_failed', {
        category,
        style,
        quality_tier: qualityTier,
      });
      setError(err instanceof Error && err.message
        ? err.message
        : 'We hit a snag generating your project. Your photo and choices are still here, so please try again.');
      setStep(recoveryStep);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {step !== 'loading' && (
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1f7cf7] mb-1">naili vision</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Start your project from a real photo</h1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
                naili reads the actual photo with your request first, then turns that analysis into a cost range, materials plan, contractor brief, and a fast first concept.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-900" />
              Private by default, no contractor outreach yet
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {visibleSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 min-w-fit">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                    currentVisibleStepIndex > i
                      ? 'bg-[#1f7cf7] text-white'
                      : currentVisibleStepIndex === i
                      ? 'bg-[#1f7cf7] text-white ring-4 ring-[#d7f4ff]'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {currentVisibleStepIndex > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                {i < visibleSteps.length - 1 && (
                  <div className={cn('h-0.5 w-8 sm:w-12', currentVisibleStepIndex > i ? 'bg-[#1f7cf7]' : 'bg-slate-200')} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'entry' && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Show naili your space</h2>
              <p className="text-slate-600">One clear photo is enough to start. Add your ZIP code so the estimate uses local pricing, not a generic national average.</p>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-3xl p-5 sm:p-7 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-[#1f7cf7] bg-[#eef8ff]' : 'border-slate-300 hover:border-[#48c7f1] hover:bg-slate-50'
              )}
            >
              <input {...getInputProps()} />
              {uploadPreview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadPreview} alt="Upload preview" className="max-h-72 w-full object-cover mx-auto rounded-2xl mb-4" />
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{uploadedFile?.name}</p>
                      <p className="text-xs text-slate-500">You can replace this photo if you want a better angle.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <ImagePlus className="h-4 w-4" />
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUpload();
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#1f7cf7]">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-slate-900 font-semibold text-lg">Drag and drop a photo, or click to browse</p>
                  <p className="text-sm text-slate-500 mt-2">JPG, PNG, or WEBP. A clean, well-lit image gives the best planning output.</p>
                </>
              )}
            </div>

            <div className="mt-5">
              <Input
                label="ZIP code"
                placeholder="10001"
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                required
              />
              <p className="mt-2 text-xs text-slate-500">
                Used for regional pricing and labor assumptions, not for contractor outreach.
              </p>
            </div>

            {error && <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

            <Button className="w-full mt-6" size="lg" onClick={handleEntryNext} disabled={!uploadedFile || !zipCode.trim()}>
              Continue
            </Button>
          </Card>

          <div className="space-y-4">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                <Info className="h-4 w-4 text-[#1f7cf7]" />
                Best photo tips
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {PHOTO_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#7ccf43] mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 sm:p-6 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-semibold mb-3">
                <Sparkles className="h-4 w-4 text-[#8be0f7]" />
                What you&apos;ll get first
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Rough budget range</li>
                <li>Materials list and allowances</li>
                <li>Contractor-ready brief</li>
                <li>Extra concepts can keep loading after results open</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {step === 'category' && (
        <div>
          <button onClick={() => setStep('entry')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">What are you planning?</h2>
            <p className="text-slate-600">Choose the closest project type. If your situation is unusual, the custom project option still works well.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {(Object.entries(PROJECT_CATEGORIES) as [ProjectCategory, typeof PROJECT_CATEGORIES[ProjectCategory]][]).map(([key, cat]) => (
              <Card
                key={key}
                hover
                selected={category === key}
                onClick={() => {
                  setCategory(key);
                  setScopeAnswers({});
                  if (key !== 'custom_project' && !notes.trim()) {
                    setNotes('');
                  }
                }}
                className="text-left cursor-pointer p-4 sm:p-5"
              >
                <div className="text-3xl mb-3">{cat.emoji}</div>
                <div className="font-semibold text-slate-900 text-sm sm:text-base">{cat.label}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{cat.description}</div>
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
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">A few quick scope details</h2>
            <p className="text-slate-600">These answers help tighten the estimate faster, but you can skip them and let naili lean more heavily on the photo and your notes.</p>
          </div>

          <div className="space-y-6 mb-8">
            {scopeQuestions.map((question) => (
              <div key={question.key}>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">{question.label}</h3>
                  {question.helper && <p className="text-sm text-slate-500 mt-1">{question.helper}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="w-full" size="lg" onClick={handleScopeNext} disabled={!allScopeAnswered}>
              Continue
            </Button>
            <Button className="w-full sm:w-auto" size="lg" variant="secondary" onClick={handleScopeSkip}>
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {step === 'style' && (
        <div>
          <button onClick={() => setStep(hasScopeStep ? 'scope' : 'category')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Pick the overall style direction</h2>
            <p className="text-slate-600">This mostly shapes the brief and concept direction. You can still use the planning outputs even if your style evolves later.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {(Object.entries(STYLE_OPTIONS) as [StylePreference, typeof STYLE_OPTIONS[StylePreference]][]).map(([key, opt]) => (
              <Card
                key={key}
                hover
                selected={style === key}
                onClick={() => setStyle(key)}
                className="cursor-pointer p-4"
              >
                <div className="w-8 h-8 rounded-full mb-3 ring-4 ring-white shadow-sm" style={{ background: opt.color }} />
                <div className="font-semibold text-slate-900">{opt.label}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{opt.description}</div>
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
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Set the finish level</h2>
            <p className="text-slate-600">Choose the tier that feels closest to what you would actually buy, not the dream version unless that is truly the plan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {QUALITY_TIERS.map((tier) => (
              <Card
                key={tier.value}
                hover
                selected={qualityTier === tier.value}
                onClick={() => setQualityTier(tier.value)}
                className="cursor-pointer p-5"
              >
                <div className="text-2xl mb-2">{tier.emoji}</div>
                <div className="font-bold text-slate-900 text-lg mb-1">{tier.label}</div>
                <div className="text-sm text-slate-600 mb-4 leading-relaxed">{tier.desc}</div>
                <div className="text-xs font-medium text-[#0f5fc6] bg-[#eef8ff] rounded-lg px-2.5 py-1.5 inline-block">{tier.modifier}</div>
              </Card>
            ))}
          </div>

          <Card className="mb-6 p-5 sm:p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isCustomProject ? 'Describe what you want to change' : 'Anything specific we should account for?'}{' '}
              {!isCustomProject && <span className="text-slate-400">(optional)</span>}
            </label>
            <p className="text-sm text-slate-500 mb-3">
              {isCustomProject
                ? 'Tell naili what you want updated, repaired, redesigned, or added. Specific notes help both the estimate and contractor brief.'
                : 'Useful details include pets, existing damage, finish preferences, materials you want to avoid, or anything a contractor should notice fast.'}
            </p>
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1] resize-none"
              rows={isCustomProject ? 5 : 4}
              placeholder={isCustomProject ? 'e.g. Replace the old pergola with a covered outdoor kitchen, improve lighting near the patio, and make it easier to entertain.' : 'e.g. Need durable flooring because of a dog, want warmer tones, and current trim has a lot of visible wear.'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Card>

          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-4">{error}</div>}

          <Button className="w-full" size="lg" onClick={handleStart} disabled={isCustomProject && !notes.trim()}>
            Nail it
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3">You&apos;ll land on the results page as soon as the planning outputs are ready.</p>
        </div>
      )}

      {step === 'loading' && (
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] px-6 py-10 text-center text-white shadow-[0_24px_90px_rgba(15,23,42,0.26)] sm:px-8 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.16),transparent_24%)]" />
          <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#1f7cf7]/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur mb-8">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">naili vision</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Nail the vision. Know the cost.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              We&apos;re reading your actual photo and request first, then turning that analysis into your estimate, materials list, contractor brief, and a fast first concept.
            </p>
            <p className="mt-3 text-sm text-white/60">Design concepts may keep rendering in the background after your results page opens.</p>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="space-y-3 text-left">
                {PROGRESS_STEPS.map((label, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 rounded-[1.5rem] border px-4 py-4 backdrop-blur transition-all',
                      i < progressStep
                        ? 'border-[#b6ef72]/30 bg-[#a8eb57]/12 text-[#effdd8]'
                        : i === progressStep
                        ? 'border-white/20 bg-white/12 text-white'
                        : 'border-white/10 bg-white/6 text-white/45'
                    )}
                  >
                    {i < progressStep ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-[#b6ef72]" />
                    ) : i === progressStep ? (
                      <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-[#a8eb57]" />
                    ) : (
                      <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-white/30" />
                    )}
                    <span className="text-sm sm:text-base">{label}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 text-left backdrop-blur-xl">
                <p className="text-sm font-semibold text-white mb-3">What naili sees so far</p>
                {analysisHighlights.length > 0 ? (
                  <div className="space-y-3">
                    {analysisHighlights.map((item, index) => (
                      <div key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-white/80">
                        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#a8eb57]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-white/65">
                    <div className="rounded-2xl bg-white/5 px-4 py-3">Reading the photo and identifying the visible project scope.</div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">Matching your request against the actual room condition and materials.</div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">Calculating budget ranges and a contractor-ready plan for your ZIP code.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
