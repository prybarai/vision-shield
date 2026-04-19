'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, type FileRejection } from 'react-dropzone';
import {
  Sparkles,
  Upload,
  MapPin,
  Home,
  Palette,
  Zap,
  Loader2,
  CheckCircle,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { PROJECT_CATEGORIES, STYLE_OPTIONS } from '@/types';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import posthog from 'posthog-js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const SIMPLIFIED_CATEGORIES = [
  { key: 'interior_paint', label: 'Paint a room', emoji: '🎨', color: 'bg-blue-100 text-blue-700' },
  { key: 'bathroom', label: 'Bathroom refresh', emoji: '🚿', color: 'bg-teal-100 text-teal-700' },
  { key: 'kitchen', label: 'Kitchen update', emoji: '🍳', color: 'bg-amber-100 text-amber-700' },
  { key: 'flooring', label: 'New flooring', emoji: '🪵', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'deck_patio', label: 'Deck or patio', emoji: '🌿', color: 'bg-green-100 text-green-700' },
  { key: 'landscaping', label: 'Landscaping', emoji: '🌳', color: 'bg-lime-100 text-lime-700' },
  { key: 'custom_project', label: 'Something else', emoji: '✨', color: 'bg-purple-100 text-purple-700' },
];

const SIMPLIFIED_STYLES = [
  { key: 'modern', label: 'Modern', desc: 'Clean lines, minimal', color: 'bg-slate-800' },
  { key: 'transitional', label: 'Transitional', desc: 'Balanced blend', color: 'bg-slate-600' },
  { key: 'traditional', label: 'Traditional', desc: 'Classic, timeless', color: 'bg-amber-800' },
  { key: 'coastal', label: 'Coastal', desc: 'Light, airy, relaxed', color: 'bg-cyan-600' },
  { key: 'industrial', label: 'Industrial', desc: 'Raw, urban', color: 'bg-gray-700' },
  { key: 'scandinavian', label: 'Scandinavian', desc: 'Warm minimalism', color: 'bg-slate-100 border border-slate-300' },
];

type Step = 'upload' | 'category' | 'style' | 'generating';

export default function SimplifiedVisionFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [zipCode, setZipCode] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [style, setStyle] = useState<string>('modern');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setError('Please upload a JPG, PNG, or WEBP image.');
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setError('Image must be under 10MB.');
        return;
      }

      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }

      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
      setError(null);
      
      // Auto-advance if we have ZIP
      if (zipCode.trim()) {
        setTimeout(() => setStep('category'), 300);
      }
    }
  }, [uploadPreview, zipCode]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0];
    if (firstError?.code === 'file-too-large') {
      setError('Image must be under 10MB.');
    } else if (firstError?.code === 'file-invalid-type') {
      setError('Please upload a JPG, PNG, or WEBP image.');
    } else {
      setError('Please upload a supported image.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
  });

  const handleStart = async () => {
    if (!uploadedFile || !zipCode.trim() || !category) {
      setError('Please complete all steps.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const sessionId = uuidv4();
      
      // Create project
      const projectRes = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_type: PROJECT_CATEGORIES[category as keyof typeof PROJECT_CATEGORIES]?.type || 'interior',
          project_category: category,
          zip_code: zipCode.trim(),
          style_preference: style,
          quality_tier: 'mid',
          notes: notes.trim() || undefined,
          session_id: sessionId,
        }),
      });

      if (!projectRes.ok) throw new Error('Failed to create project');
      const { project } = await projectRes.json();
      const projectId = project.id;

      // Upload image
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const uploadRes = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      
      // Start generation
      await Promise.all([
        fetch('/api/vision/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: uploadPreview,
            category,
            zip_code: zipCode.trim(),
            notes: notes.trim() || undefined,
          }),
        }),
        fetch('/api/vision/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            category,
            location_type: PROJECT_CATEGORIES[category as keyof typeof PROJECT_CATEGORIES]?.type || 'interior',
            style,
            quality_tier: 'mid',
            zip_code: zipCode.trim(),
            notes: notes.trim() || undefined,
          }),
        }),
      ]);

      // Redirect to results
      router.push(`/vision/results/${projectId}`);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {(['upload', 'category', 'style'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
              step === s ? 'bg-ink text-white' : 
              (['upload', 'category', 'style'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500')
            )}>
              {['upload', 'category', 'style'].indexOf(step) > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-sm font-medium hidden sm:inline',
              step === s ? 'text-ink' : 'text-gray-500'
            )}>
              {s === 'upload' ? 'Photo' : s === 'category' ? 'Project' : 'Style'}
            </span>
            {i < 2 && <div className="h-0.5 w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-sand/20 px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-ink-600">Step 1 of 3</span>
          </div>
          <h1 className="text-4xl font-bold text-ink mb-4">Show us your space</h1>
          <p className="text-lg text-ink-600 mb-8 max-w-2xl mx-auto">
            Upload one photo of any room or area. We'll handle the rest.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload area */}
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                  isDragActive ? 'border-sand-dark bg-sand/10' : 
                  uploadPreview ? 'border-green-200 bg-green-50/50' : 'border-gray-300 hover:border-sand hover:bg-gray-50'
                )}
              >
                <input {...getInputProps()} />
                {uploadPreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto max-w-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={uploadPreview} 
                        alt="Preview" 
                        className="rounded-xl w-full h-48 object-cover"
                      />
                      <div className="absolute -top-2 -right-2 rounded-full bg-green-500 p-1">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Photo uploaded ✓</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        URL.revokeObjectURL(uploadPreview);
                        setUploadPreview(null);
                        setUploadedFile(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Choose different photo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand/20">
                      <Upload className="h-8 w-8 text-sand-dark" />
                    </div>
                    <p className="text-lg font-semibold text-ink">Drag & drop a photo</p>
                    <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-4">JPG, PNG, or WEBP • Max 10MB</p>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your ZIP code
                    </label>
                    <input
                      type="text"
                      placeholder="10001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-medium placeholder-gray-400 focus:border-sand focus:outline-none focus:ring-2 focus:ring-sand/30"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For local pricing accuracy
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-sand/10 to-mint/10 p-6">
                <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Best photo tips
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Stand in the center of the room</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Turn on all lights for best detail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Include as much of the space as possible</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-gray-900 p-6 text-white">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  What you'll get
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• A visual concept of your transformed space</li>
                  <li>• Local cost estimate for the project</li>
                  <li>• Materials list & contractor brief</li>
                  <li>• Everything in under 2 minutes</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            className="mt-8 w-full max-w-md text-lg py-4"
            size="lg"
            onClick={() => {
              if (!uploadedFile) {
                setError('Please upload a photo first.');
                return;
              }
              if (!zipCode.trim()) {
                setError('Please enter your ZIP code.');
                return;
              }
              setStep('category');
            }}
          >
            Continue to project type
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step 2: Category */}
      {step === 'category' && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-sand/20 px-4 py-2 mb-6">
            <Home className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-ink-600">Step 2 of 3</span>
          </div>
          <h1 className="text-4xl font-bold text-ink mb-4">What are you planning?</h1>
          <p className="text-lg text-ink-600 mb-8 max-w-2xl mx-auto">
            Choose the closest match. Don't worry about being perfect.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {SIMPLIFIED_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={cn(
                  'rounded-2xl border-2 p-6 text-left transition-all hover:-translate-y-1',
                  category === cat.key 
                    ? 'border-sand-dark bg-sand/10 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                )}
              >
                <div className="text-3xl mb-3">{cat.emoji}</div>
                <div className="font-semibold text-ink text-lg">{cat.label}</div>
                {category === cat.key && (
                  <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Notes for custom projects */}
          {category === 'custom_project' && (
            <div className="mb-8 max-w-2xl mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about your project
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., 'I want to add built-in shelves to my living room wall' or 'Need to repair water damage in basement'"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-sand focus:outline-none focus:ring-2 focus:ring-sand/30"
                rows={3}
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => setStep('upload')}
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (!category) {
                  setError('Please select a project type.');
                  return;
                }
                if (category === 'custom_project' && !notes.trim()) {
                  setError('Please describe your custom project.');
                  return;
                }
                setStep('style');
              }}
              disabled={!category || (category === 'custom_project' && !notes.trim())}
            >
              Continue to style
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Style */}
      {step === 'style' && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-sand/20 px-4 py-2 mb-6">
            <Palette className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-ink-600">Step 3 of 3</span>
          </div>
          <h1 className="text-4xl font-bold text-ink mb-4">Pick your vibe</h1>
          <p className="text-lg text-ink-600 mb-8 max-w-2xl mx-auto">
            This shapes the visual direction. You can always adjust later.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {SIMPLIFIED_STYLES.map((styleOption) => (
              <button
                key={styleOption.key}
                type="button"
                onClick={() => setStyle(styleOption.key)}
                className={cn(
                  'rounded-2xl border-2 p-6 text-left transition-all hover:-translate-y-1',
                  style === styleOption.key 
                    ? 'border-sand-dark bg-sand/10 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                )}
              >
                <div 
                  className="h-8 w-8 rounded-full mb-3" 
                  style={{ backgroundColor: styleOption.color.includes('bg-') ? '' : styleOption.color }}
                />
                <div className="font-semibold text-ink text-lg">{styleOption.label}</div>
                <div className="text-sm text-gray-600 mt-1">{styleOption.desc}</div>
                {style === styleOption.key && (
                  <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => setStep('category')}
            >
              Back
            </Button>
            <Button
              onClick={handleStart}
              disabled={isGenerating}
              className="bg-gradient-to-r from-sand-dark to-sand text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating your vision...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  See your transformation
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700 text-sm max-w-2xl mx-auto">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="text-center py-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-sand/20 mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-sand-dark" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-3">Creating your vision</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            We're analyzing your photo, calculating costs, and generating your first concept.
            This usually takes about 60 seconds.
          </p>
          <div className="mt-8 max-w-md mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sand to-sand-dark rounded-full animate-pulse"
              style={{ width: '70%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
