'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectActions } from '@/lib/ProjectContext';

interface ImageUploadProps {
  onUploadComplete?: (imageUrl: string) => void;
  className?: string;
}

export default function ImageUpload({ onUploadComplete, className }: ImageUploadProps) {
  const { setUploadedImage, setUserDescription, setError } = useProjectActions();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    validateAndProcessFile(file);
  };

  const validateAndProcessFile = (file: File) => {
    setValidationError(null);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setValidationError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Image is too large. Maximum size is 10MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      
      // Check image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          setValidationError('Naili works best with high-res photos. This one is a bit too small to see the details.');
          return;
        }
        
        // Check for screenshot of screenshot (basic check for UI elements)
        if (img.width === img.height && img.width <= 1000) {
          // Could be a screenshot - warn but don't block
          console.log('Possible screenshot detected');
        }
        
        // Auto-generate description based on filename
        const autoDescription = file.name
          .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\d+/g, '')
          .trim();
        
        if (autoDescription.length > 3) {
          setDescription(autoDescription.charAt(0).toUpperCase() + autoDescription.slice(1));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setDescription('');
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    if (!previewUrl) {
      setValidationError('Please upload an image first');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please describe your project');
      return;
    }

    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setUploadedImage(previewUrl);
      setUserDescription(description);
      setIsUploading(false);
      onUploadComplete?.(previewUrl);
    }, 1000);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E3A8A]/10 to-[#FF6B35]/10 px-4 py-2">
          <Camera className="h-4 w-4 text-[#1E3A8A]" />
          <span className="text-sm font-semibold text-[#1E3A8A]">STEP 1: UPLOAD YOUR SPACE</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">
          Upload a photo of your project
        </h2>
        <p className="mt-3 text-lg text-slate-600">
          Naili will analyze it and create a visual concept you can explore
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload project photo"
        />

        {!previewUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all',
              isDragging
                ? 'border-[#1E3A8A] bg-[#1E3A8A]/5'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <div className="p-12 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#eef8ff]">
                <Upload className="h-12 w-12 text-[#1E3A8A]" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Drag & drop your photo here
              </h3>
              <p className="mb-6 text-slate-600">
                or click to browse files
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2">
                <ImageIcon className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  JPEG, PNG, WebP • Max 10MB
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* Image Preview */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={previewUrl}
                alt="Project preview"
                className="h-full w-full object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 backdrop-blur-sm hover:bg-white"
                aria-label="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 backdrop-blur-sm">
                ✓ Ready for analysis
              </div>
            </div>

            {/* Description Input */}
            <div className="border-t border-slate-200 p-6">
              <label className="mb-3 block">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-slate-900">Describe your project</span>
                  <span className="text-sm text-slate-500">(What are you planning to do?)</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 'Refresh our small bathroom with new vanity and lighting' or 'Build a deck in the backyard'"
                  className="h-32 w-full rounded-xl border border-slate-300 p-4 focus:border-[#1E3A8A] focus:outline-none"
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
              </label>
            </div>
          </motion.div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">{validationError}</p>
              <p className="mt-1 text-sm text-amber-800">
                {validationError.includes('small') 
                  ? 'Try using a photo from your camera roll instead.'
                  : 'Please try a different image.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h4 className="mb-4 font-semibold text-slate-900">Tips for best results</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2">
              <span className="text-[#1E3A8A]">📸</span>
            </div>
            <div>
              <div className="font-medium text-slate-900">Use good lighting</div>
              <div className="text-sm text-slate-600">Natural light shows details best</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2">
              <span className="text-[#1E3A8A]">🎯</span>
            </div>
            <div>
              <div className="font-medium text-slate-900">Stand back</div>
              <div className="text-sm text-slate-600">Show the whole space, not just a corner</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2">
              <span className="text-[#1E3A8A]">📝</span>
            </div>
            <div>
              <div className="font-medium text-slate-900">Be specific</div>
              <div className="text-sm text-slate-600">"Kitchen cabinets" vs "kitchen update"</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2">
              <span className="text-[#1E3A8A]">🔄</span>
            </div>
            <div>
              <div className="font-medium text-slate-900">Multiple angles</div>
              <div className="text-sm text-slate-600">Upload different views for complex projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {previewUrl ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Photo uploaded and ready for analysis</span>
              </span>
            ) : (
              'Upload a photo to get started'
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          {previewUrl && (
            <button
              onClick={handleRemoveImage}
              className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Upload Different Photo
            </button>
          )}
          
          <button
            onClick={handleContinue}
            disabled={!previewUrl || !description.trim() || isUploading}
            className={cn(
              'rounded-xl px-8 py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100',
              previewUrl && description.trim()
                ? 'bg-gradient-to-r from-[#1E3A8A] to-[#FF6B35]'
                : 'bg-slate-400'
            )}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing your photo...
              </span>
            ) : (
              'Continue to Style Quiz'
            )}
          </button>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#eef8ff] p-2">
            <span className="text-[#1E3A8A]">🔒</span>
          </div>
          <div>
            <p className="text-sm text-slate-700">
              <strong>Your privacy matters:</strong> Photos are analyzed by AI to create your concept 
              and estimate. They're never shared without your permission and are deleted after 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
