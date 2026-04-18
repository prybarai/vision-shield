'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2, Sparkles, Home, Building, Trees } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkingVisionStart() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [zipCode, setZipCode] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!previewUrl || !description.trim() || !category || !zipCode.trim()) {
      setError('Please fill in all fields and upload a photo');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create a project first
      const projectResponse = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description,
          zip_code: zipCode,
        }),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const projectData = await projectResponse.json();
      const projectId = projectData.project_id;

      // Upload the image
      const formData = new FormData();
      const blob = await fetch(previewUrl).then(r => r.blob());
      formData.append('image', blob, 'project-photo.jpg');
      formData.append('project_id', projectId);

      const uploadResponse = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Redirect to analysis
      router.push(`/vision/results/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsUploading(false);
    }
  };

  const categories = [
    { id: 'exterior', label: 'Exterior / Yard', icon: <Trees className="h-5 w-5" /> },
    { id: 'interior_paint', label: 'Interior Paint', icon: <Home className="h-5 w-5" /> },
    { id: 'bathroom', label: 'Bathroom', icon: <Building className="h-5 w-5" /> },
    { id: 'kitchen', label: 'Kitchen', icon: <Building className="h-5 w-5" /> },
    { id: 'deck', label: 'Deck / Patio', icon: <Trees className="h-5 w-5" /> },
    { id: 'roof', label: 'Roof', icon: <Building className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-slate-900">Start Your Project</h1>
              <p className="text-sm text-slate-600">Upload a photo and get an AI estimate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 px-4 py-2">
            <Camera className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">STEP 1: UPLOAD & DESCRIBE</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            Upload a photo of your space
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Get an AI-powered estimate and visual concept
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-2xl border-2 border-dashed transition-all',
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="p-12 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                <Upload className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                {isDragActive ? 'Drop your photo here' : 'Drag & drop your photo here'}
              </h3>
              <p className="mb-6 text-slate-600">
                or click to browse files
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2">
                <span className="text-sm font-medium text-slate-700">
                  JPEG, PNG, WebP • Max 10MB
                </span>
              </div>
            </div>
          </div>

          {previewUrl && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={previewUrl}
                  alt="Project preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 backdrop-blur-sm">
                  ✓ Photo uploaded
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="mb-8 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-900">
              What type of project is this?
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                    category === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    'rounded-lg p-2',
                    category === cat.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  )}>
                    {cat.icon}
                  </div>
                  <span className="font-medium text-slate-900">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-900">
              Describe what you want to do
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Refresh our small bathroom with new vanity and lighting' or 'Build a deck in the backyard'"
              className="h-32 w-full rounded-xl border border-slate-300 p-4 focus:border-blue-500 focus:outline-none"
              maxLength={200}
            />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">
                Be specific for better results
              </span>
              <span className={cn(
                'tabular-nums',
                description.length > 180 ? 'text-amber-600' : 'text-slate-500'
              )}>
                {description.length}/200
              </span>
            </div>
          </div>

          {/* ZIP Code */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-900">
              ZIP Code (for local pricing)
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              placeholder="12345"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              maxLength={5}
            />
            <p className="mt-2 text-sm text-slate-500">
              Used to estimate local labor and material costs
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900">{error}</p>
                <p className="mt-1 text-sm text-red-800">
                  Please check your inputs and try again
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h4 className="mb-4 font-semibold text-slate-900">Tips for best results</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2">
                <span className="text-blue-600">📸</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Use good lighting</div>
                <div className="text-sm text-slate-600">Natural light shows details best</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2">
                <span className="text-blue-600">🎯</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Stand back</div>
                <div className="text-sm text-slate-600">Show the whole space, not just a corner</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2">
                <span className="text-blue-600">📝</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Be specific</div>
                <div className="text-sm text-slate-600">&quot;Kitchen cabinets&quot; vs &quot;kitchen update&quot;</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2">
                <span className="text-blue-600">📍</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">ZIP Code matters</div>
                <div className="text-sm text-slate-600">Local costs vary by region</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600">
              {previewUrl && description && category && zipCode ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Ready to analyze your project</span>
                </span>
              ) : (
                'Complete all fields to continue'
              )}
            </p>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!previewUrl || !description.trim() || !category || !zipCode.trim() || isUploading}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100',
              'bg-gradient-to-r from-blue-600 to-blue-700'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing your photo...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Get AI Estimate
              </>
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <span className="text-blue-600">🔒</span>
            </div>
            <div>
              <p className="text-sm text-slate-700">
                <strong>Your privacy matters:</strong> Photos are analyzed by AI to create your estimate. 
                They're never shared without your permission and are deleted after 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
