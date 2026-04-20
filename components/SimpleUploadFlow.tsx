'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, MapPin, Sparkles, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function SimpleUploadFlow() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
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
    }
  }, [uploadPreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
  });

  const handleStartAnalysis = async () => {
    if (!uploadedFile || !zipCode.trim()) {
      setError(zipCode.trim() ? 'Please upload a photo.' : 'Please enter your ZIP code for local pricing.');
      return;
    }

    if (zipCode.length < 5) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Create a project
      const createResponse = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip_code: zipCode,
          project_category: 'custom_project',
          quality_tier: 'mid',
          style_preference: 'modern',
          notes: 'Photo uploaded from homepage',
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create project');
      }

      const { project } = await createResponse.json();
      const projectId = project.id;

      // Step 2: Upload the file to the correct bucket
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const uploadResponse = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || 'Upload failed');
      }

      // Step 3: Redirect to vision start
      router.push(`/vision/start?from=${projectId}&zip=${encodeURIComponent(zipCode)}&image=${encodeURIComponent(uploadPreview || '')}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadedFile(null);
    setUploadPreview(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 px-4 py-2 mb-4">
          <Sparkles className="h-4 w-4 text-sand-dark" />
          <span className="text-sm font-semibold text-gray-700">Start your project</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Upload a photo, get a complete plan</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Our AI will analyze your space and create a renovation plan with estimates, materials, and visual concepts.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column: Upload */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your ZIP code <span className="text-gray-500">(for local pricing)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10001"
                  value={zipCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setZipCode(value);
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-medium placeholder-gray-400 focus:border-sand focus:outline-none focus:ring-2 focus:ring-sand/30"
                />
              </div>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={cn(
              'border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all min-h-[300px] flex flex-col items-center justify-center',
              isDragActive
                ? 'border-sand-dark bg-sand/10'
                : uploadedFile
                ? 'border-green-500 bg-green-50/50'
                : 'border-gray-300 hover:border-sand hover:bg-gray-50'
            )}
          >
            <input {...getInputProps()} />
            
            {uploadPreview ? (
              <>
                <div className="mb-4 relative w-32 h-32 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-lg font-semibold text-gray-900">Photo uploaded ✓</p>
                <p className="text-sm text-gray-500 mt-1">
                  {uploadedFile?.name} • {(uploadedFile?.size || 0) / 1024 / 1024 > 1
                    ? `${((uploadedFile?.size || 0) / 1024 / 1024).toFixed(1)} MB`
                    : `${Math.round((uploadedFile?.size || 0) / 1024)} KB`}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Choose different photo
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-sand/20 to-mint/20">
                  <Upload className="h-10 w-10 text-sand-dark" />
                </div>
                <p className="text-xl font-semibold text-gray-900">
                  {isDragActive ? 'Drop your photo here' : 'Drag & drop a photo'}
                </p>
                <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                <p className="text-xs text-gray-400 mt-4">JPG, PNG, or WEBP • Max 10MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Right column: Explanation */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What you'll get:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI Photo Analysis</p>
                  <p className="text-sm text-gray-600">Our AI examines your space, materials, and layout</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Realistic Cost Estimate</p>
                  <p className="text-sm text-gray-600">Local pricing based on your ZIP code and project scope</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Materials List</p>
                  <p className="text-sm text-gray-600">Specific items needed for your project</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                  <span className="text-sm font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Visual Concepts</p>
                  <p className="text-sm text-gray-600">AI-generated images showing potential results</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works:</h3>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex-shrink-0">
                  1
                </span>
                <p className="text-sm text-gray-700">Upload a clear photo of your space</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex-shrink-0">
                  2
                </span>
                <p className="text-sm text-gray-700">Our AI analyzes what's visible</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex-shrink-0">
                  3
                </span>
                <p className="text-sm text-gray-700">You'll answer a few quick questions</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex-shrink-0">
                  4
                </span>
                <p className="text-sm text-gray-700">Get your complete renovation plan</p>
              </li>
            </ol>
          </div>

          <Button
            onClick={handleStartAnalysis}
            disabled={isUploading || !uploadedFile || !zipCode.trim()}
            className="w-full py-4 text-lg font-semibold"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing your photo...
              </>
            ) : (
              'Start AI Analysis'
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms and Privacy Policy. Your photo is used only for analysis.
          </p>
        </div>
      </div>
    </div>
  );
}