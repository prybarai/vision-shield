'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, type FileRejection } from 'react-dropzone';
import {
  Sparkles,
  Upload,
  MapPin,
  Home,
  Wrench,
  TreePine,
  Droplets,
  Zap,
  Loader2,
  CheckCircle,
  ArrowRight,
  Image as ImageIcon,
  MessageSquare,
  Calculator,
  ShoppingCart,
  Users,
  Hammer
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB for potential short videos
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

const PROJECT_TYPES = [
  { key: 'diagnose', label: 'Diagnose an issue', icon: <Wrench className="h-6 w-6" />, color: 'bg-blue-100 text-blue-700', desc: 'Plumbing, electrical, structural problems' },
  { key: 'renovate', label: 'Renovate a space', icon: <Home className="h-6 w-6" />, color: 'bg-amber-100 text-amber-700', desc: 'Rooms, kitchens, bathrooms' },
  { key: 'landscape', label: 'Improve outdoors', icon: <TreePine className="h-6 w-6" />, color: 'bg-emerald-100 text-emerald-700', desc: 'Yards, decks, patios, gardens' },
  { key: 'repair', label: 'Repair something', icon: <Hammer className="h-6 w-6" />, color: 'bg-orange-100 text-orange-700', desc: 'Fixes, maintenance, replacements' },
  { key: 'design', label: 'Design vision', icon: <Sparkles className="h-6 w-6" />, color: 'bg-purple-100 text-purple-700', desc: 'Aesthetic improvements, decor' },
  { key: 'custom', label: 'Something else', icon: <MessageSquare className="h-6 w-6" />, color: 'bg-gray-100 text-gray-700', desc: 'Describe what you need' },
];

const SKILL_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'First time, need clear instructions', emoji: '👶' },
  { key: 'handy', label: 'Handy', desc: 'Some experience with tools', emoji: '🔧' },
  { key: 'experienced', label: 'Experienced', desc: 'Comfortable with most projects', emoji: '🏗️' },
  { key: 'pro', label: 'Just hire a pro', desc: 'Want professional results', emoji: '👷' },
];

type Step = 'upload' | 'type' | 'describe' | 'skill' | 'generating';

export default function AIPoweredFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [zipCode, setZipCode] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState<string>('handy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!SUPPORTED_IMAGE_TYPES.some(type => file.type.includes(type.replace('image/', '').replace('video/', '')))) {
        setError('Please upload a JPG, PNG, WEBP image or MP4 video.');
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setError('File must be under 20MB.');
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
        setTimeout(() => setStep('type'), 300);
      }
    }
  }, [uploadPreview, zipCode]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0];
    if (firstError?.code === 'file-too-large') {
      setError('File must be under 20MB.');
    } else if (firstError?.code === 'file-invalid-type') {
      setError('Please upload a JPG, PNG, WEBP image or MP4 video.');
    } else {
      setError('Please upload a supported file.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 
      'image/jpeg': ['.jpg', '.jpeg'], 
      'image/png': ['.png'], 
      'image/webp': ['.webp'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov']
    },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
  });

  const handleStart = async () => {
    if (!uploadedFile || !zipCode.trim() || !projectType) {
      setError('Please complete all steps.');
      return;
    }

    if (projectType === 'custom' && !description.trim()) {
      setError('Please describe your project.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const sessionId = uuidv4();
      
      // Create project with AI-powered metadata
      const projectRes = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_type: projectType,
          zip_code: zipCode.trim(),
          description: description.trim() || undefined,
          skill_level: skillLevel,
          is_video: uploadedFile.type.includes('video'),
          session_id: sessionId,
        }),
      });

      if (!projectRes.ok) throw new Error('Failed to create project');
      const { project } = await projectRes.json();
      const projectId = project.id;

      // Upload file
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);
      formData.append('project_type', projectType);
      formData.append('skill_level', skillLevel);
      formData.append('description', description);

      const uploadRes = await fetch('/api/projects/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');
      
      // Start AI analysis
      await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          project_type: projectType,
          skill_level: skillLevel,
          description: description,
          zip_code: zipCode.trim(),
        }),
      });

      // Redirect to AI results page
      router.push(`/ai/results/${projectId}`);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {(['upload', 'type', 'describe', 'skill'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
              step === s ? 'bg-gradient-to-r from-sand-dark to-sand text-white' : 
              (['upload', 'type', 'describe', 'skill'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500')
            )}>
              {['upload', 'type', 'describe', 'skill'].indexOf(step) > i ? <CheckCircle className="h-5 w-5" /> : i + 1}
            </div>
            <span className={cn(
              'text-sm font-medium hidden sm:inline',
              step === s ? 'text-gray-900' : 'text-gray-500'
            )}>
              {s === 'upload' ? 'Upload' : s === 'type' ? 'Type' : s === 'describe' ? 'Describe' : 'Skill'}
            </span>
            {i < 3 && <div className="h-0.5 w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-gray-700">Step 1 of 4</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Show us what's on your mind</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload a photo or short video of anything home-related. Our AI will understand what you're looking at.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload area */}
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all min-h-[300px] flex flex-col items-center justify-center',
                  isDragActive ? 'border-sand-dark bg-sand/10' : 
                  uploadPreview ? 'border-green-200 bg-green-50/50' : 'border-gray-300 hover:border-sand hover:bg-gray-50'
                )}
              >
                <input {...getInputProps()} />
                {uploadPreview ? (
                  <div className="space-y-4 w-full">
                    <div className="relative mx-auto max-w-md">
                      {uploadedFile?.type.includes('video') ? (
                        <video 
                          src={uploadPreview} 
                          className="rounded-xl w-full h-48 object-cover"
                          controls
                        />
                      ) : (
                        <img 
                          src={uploadPreview} 
                          alt="Preview" 
                          className="rounded-xl w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute -top-2 -right-2 rounded-full bg-green-500 p-1">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {uploadedFile?.type.includes('video') ? 'Video uploaded ✓' : 'Photo uploaded ✓'}
                    </p>
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
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-sand/20 to-mint/20">
                      <Upload className="h-10 w-10 text-sand-dark" />
                    </div>
                    <p className="text-xl font-semibold text-gray-900">Drag & drop a photo or video</p>
                    <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-4">JPG, PNG, WEBP, or MP4 • Max 20MB</p>
                    <p className="text-xs text-gray-400">Short videos work great for showing issues!</p>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your ZIP code (for local pricing)
                    </label>
                    <input
                      type="text"
                      placeholder="10001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-medium placeholder-gray-400 focus:border-sand focus:outline-none focus:ring-2 focus:ring-sand/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* What AI can do */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-sand/10 to-mint/10 p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-sand-dark" />
                  What our AI understands
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span><strong>Plumbing leaks</strong> - Identifies issue type and severity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span><strong>Yard design</strong> - Suggests landscaping improvements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span><strong>Room layouts</strong> - Recommends furniture placement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span><strong>Structural issues</strong> - Flags potential problems</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-gray-900 p-6 text-white">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  What you'll get
                </h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <Calculator className="h-4 w-4 mt-0.5 text-green-400" />
                    <span><strong>AI diagnosis</strong> - Understands what you're showing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShoppingCart className="h-4 w-4 mt-0.5 text-blue-400" />
                    <span><strong>Materials list</strong> - With purchase options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-0.5 text-purple-400" />
                    <span><strong>Pro matching</strong> - Local contractors if needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Hammer className="h-4 w-4 mt-0.5 text-amber-400" />
                    <span><strong>DIY guidance</strong> - Step-by-step if you want to try</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700 text-sm max-w-2xl mx-auto">
              {error}
            </div>
          )}

          <Button
            className="mt-8 w-full max-w-md text-lg py-4 bg-gradient-to-r from-sand-dark to-sand"
            size="lg"
            onClick={() => {
              if              if (!uploadedFile) {
                setError('Please upload a photo or video first.');
                return;
              }
              if (!zipCode.trim()) {
                setError('Please enter your ZIP code for local pricing.');
                return;
              }
              setStep('type');
            }}
          >
            Continue to project type
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step 2: Project Type */}
      {step === 'type' && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 px-4 py-2 mb-6">
            <Home className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-gray-700">Step 2 of 4</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What kind of project is this?</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Help our AI understand your goal. Choose the closest match.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  setProjectType(type.key);
                  if (type.key !== 'custom') {
                    setTimeout(() => setStep('skill'), 300);
                  } else {
                    setTimeout(() => setStep('describe'), 300);
                  }
                }}
                className={cn(
                  'rounded-2xl border-2 p-6 text-left transition-all hover:-translate-y-1 hover:shadow-lg',
                  projectType === type.key 
                    ? 'border-sand-dark bg-gradient-to-br from-sand/10 to-mint/10 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className={cn('inline-flex p-3 rounded-xl mb-4', type.color)}>
                  {type.icon}
                </div>
                <div className="font-semibold text-gray-900 text-lg mb-2">{type.label}</div>
                <div className="text-sm text-gray-600">{type.desc}</div>
                {projectType === type.key && (
                  <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Selected - continuing to next step
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => setStep('upload')}
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (!projectType) {
                  setError('Please select a project type.');
                  return;
                }
                if (projectType === 'custom') {
                  setStep('describe');
                } else {
                  setStep('skill');
                }
              }}
              disabled={!projectType}
            >
              {projectType === 'custom' ? 'Describe your project' : 'Continue to skill level'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Describe (for custom projects) */}
      {step === 'describe' && (
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 px-4 py-2 mb-6">
            <MessageSquare className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-gray-700">Step 3 of 4</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tell us about your project</h1>
          <p className="text-lg text-gray-600 mb-8">
            The more details you provide, the better our AI can help.
          </p>

          <div className="mb-8">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Examples:
• 'I have a leak under my kitchen sink'
• 'Want to turn my backyard into an entertaining space'
• 'Need to repair drywall damage from water leak'
• 'Thinking about converting my garage to a home gym'
• 'My deck boards are rotting and need replacement'"
              className="w-full rounded-2xl border border-gray-300 px-6 py-4 text-gray-700 placeholder-gray-400 focus:border-sand focus:outline-none focus:ring-2 focus:ring-sand/30 min-h-[200px] text-lg"
              rows={6}
            />
            <p className="text-sm text-gray-500 mt-2 text-left">
              Be specific about what you want to achieve or fix.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => setStep('type')}
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (!description.trim()) {
                  setError('Please describe your project.');
                  return;
                }
                setStep('skill');
              }}
              disabled={!description.trim()}
            >
              Continue to skill level
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Skill Level */}
      {step === 'skill' && (
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 px-4 py-2 mb-6">
            <Hammer className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-gray-700">Step 4 of 4</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What's your comfort level?</h1>
          <p className="text-lg text-gray-600 mb-8">
            This helps us tailor the plan to you—DIY instructions or pro recommendations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.key}
                type="button"
                onClick={() => setSkillLevel(level.key)}
                className={cn(
                  'rounded-2xl border-2 p-6 text-left transition-all hover:-translate-y-1',
                  skillLevel === level.key 
                    ? 'border-sand-dark bg-gradient-to-br from-sand/10 to-mint/10 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                )}
              >
                <div className="text-3xl mb-3">{level.emoji}</div>
                <div className="font-semibold text-gray-900 text-lg mb-2">{level.label}</div>
                <div className="text-sm text-gray-600">{level.desc}</div>
                {skillLevel === level.key && (
                  <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-sand/10 to-mint/10">
            <p className="text-gray-700 font-medium">
              {skillLevel === 'beginner' && "We'll focus on simple DIY steps or recommend hiring a pro."}
              {skillLevel === 'handy' && "We'll provide clear instructions for a weekend project."}
              {skillLevel === 'experienced' && "We'll give you pro-level plans and material specs."}
              {skillLevel === 'pro' && "We'll match you with local professionals and provide bid-ready specs."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => projectType === 'custom' ? setStep('describe') : setStep('type')}
            >
              Back
            </Button>
            <Button
              onClick={handleStart}
              disabled={isGenerating}
              className="bg-gradient-to-r from-sand-dark to-sand text-white shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  AI is analyzing your project...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get your AI-powered plan
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
        <div className="text-center py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-sand/20 to-mint/20 mb-6">
            <Loader2 className="h-10 w-10 animate-spin text-sand-dark" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI is analyzing your project</h2>
          <p className="text-gray-600 max-w-md mx-auto text-lg">
            Our AI is examining your {uploadedFile?.type.includes('video') ? 'video' : 'photo'}, 
            understanding your goal, and building a complete plan tailored to your skill level.
          </p>
          
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-500 mb-2">Step 1 of 3</div>
                <div className="font-medium text-gray-900">Analyzing visual content</div>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sand to-sand-dark rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-500 mb-2">Step 2 of 3</div>
                <div className="font-medium text-gray-900">Building project plan</div>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sand to-sand-dark rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-500 mb-2">Step 3 of 3</div>
                <div className="font-medium text-gray-900">Generating materials & pricing</div>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sand to-sand-dark rounded-full animate-pulse" style={{ width: '30%' }} />
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              This usually takes 60-90 seconds. You'll get:
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                <CheckCircle className="h-3 w-3" /> AI Diagnosis
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                <Calculator className="h-3 w-3" /> Cost Estimate
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
                <ShoppingCart className="h-3 w-3" /> Materials List
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                <Users className="h-3 w-3" /> Pro Matching
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}