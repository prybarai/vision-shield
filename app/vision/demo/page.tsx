'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Upload } from 'lucide-react';
import VisionReveal from '@/components/vision/VisionReveal';
import StyleQuizBubbles from '@/components/vision/StyleQuizBubbles';
import ProjectFateCard from '@/components/vision/ProjectFateCard';
import ClarificationModal from '@/components/vision/ClarificationModal';
import { useProjectStorage } from '@/lib/hooks/useProjectStorage';
import Link from 'next/link';

const DEMO_IMAGE = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
const DEMO_DESCRIPTION = 'Small bathroom refresh with new vanity, lighting, and tile';

export default function VisionDemoPage() {
  const [step, setStep] = useState<'upload' | 'reveal' | 'style' | 'fate'>('upload');
  const [selectedStyles, setSelectedStyles] = useState<any[]>([]);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const { saveProject } = useProjectStorage();

  const handleUpload = () => {
    setStep('reveal');
  };

  const handleRevealComplete = () => {
    setTimeout(() => setStep('style'), 1000);
  };

  const handleStyleSelection = (styles: any[]) => {
    setSelectedStyles(styles);
    setTimeout(() => setStep('fate'), 800);
  };

  const handlePathSelected = (path: 'diy' | 'pro') => {
    // Show clarification modal before finalizing
    setShowClarificationModal(true);
  };

  const handleClarificationComplete = (answers: Record<string, string>) => {
    setClarificationAnswers(answers);
    
    // Save project to vision board
    saveProject({
      photoUrl: DEMO_IMAGE,
      description: DEMO_DESCRIPTION,
      costRange: { low: 8500, high: 15000 },
      difficultyScore: 4,
      selectedPath: 'diy',
      styleVibes: selectedStyles.map(s => s.label),
    });

    alert('Project saved to your Naili Vision Board!');
  };

  const handleSaveToVisionBoard = () => {
    saveProject({
      photoUrl: DEMO_IMAGE,
      description: DEMO_DESCRIPTION,
      costRange: { low: 8500, high: 15000 },
      difficultyScore: 4,
      selectedPath: 'diy',
      styleVibes: selectedStyles.map(s => s.label),
    });
    alert('Project saved! Visit "My Projects" to see your vision board.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Naili Vision Demo</h1>
              <p className="text-sm text-slate-600">Experience the new addictive design game</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/my-projects"
                className="text-sm font-medium text-[#1f7cf7] hover:text-[#0f5fc6]"
              >
                My Vision Board
              </Link>
              <Link
                href="/vision/start"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f7cf7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f5fc6]"
              >
                Try Real Upload
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {[
                { id: 'upload', label: 'Upload', icon: '📤' },
                { id: 'reveal', label: 'Reveal', icon: '✨' },
                { id: 'style', label: 'Style', icon: '🎨' },
                { id: 'fate', label: 'Fate', icon: '⚖️' },
              ].map((s, index) => (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-full text-lg
                        ${step === s.id
                          ? 'bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] text-white'
                          : index < ['upload', 'reveal', 'style', 'fate'].indexOf(step)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }
                      `}
                    >
                      {s.icon}
                    </div>
                    <span className="mt-2 text-sm font-medium">
                      {s.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`
                        h-0.5 flex-1 mx-2
                        ${index < ['upload', 'reveal', 'style', 'fate'].indexOf(step)
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                        }
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mx-auto max-w-2xl">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1f7cf7]/10 to-[#48c7f1]/10 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-[#1f7cf7]" />
                  <span className="text-sm font-semibold text-[#1f7cf7]">Step 1: The Magic Begins</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Upload a photo of your space
                </h2>
                <p className="mt-3 text-lg text-slate-600">
                  Naili will scan it with AI and create a visual concept you can swipe between
                </p>

                <div className="mt-10">
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12">
                    <div className="mx-auto max-w-sm">
                      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#eef8ff]">
                        <Upload className="h-10 w-10 text-[#1f7cf7]" />
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-slate-900">Demo Mode</h3>
                      <p className="mb-6 text-slate-600">
                        Using a sample bathroom photo to show the Naili experience
                      </p>
                      <button
                        onClick={handleUpload}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                      >
                        <Sparkles className="h-5 w-5" />
                        Try the Demo Experience
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <h4 className="mb-3 font-semibold text-slate-900">What happens next?</h4>
                    <ul className="space-y-3 text-left text-sm text-slate-700">
                      <li className="flex gap-3">
                        <span className="text-[#1f7cf7]">✨</span>
                        <span><strong>LIDAR Scan Effect:</strong> Watch as AI analyzes every detail of your photo</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#1f7cf7]">🎨</span>
                        <span><strong>Style Quiz:</strong> Pick 3 vibes to personalize your concept</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#1f7cf7]">⚖️</span>
                        <span><strong>Project Fate:</strong> See if Naili recommends DIY or professional help</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#1f7cf7]">🛒</span>
                        <span><strong>Shopping List:</strong> Get curated materials with affiliate links</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Reveal */}
          {step === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VisionReveal
                originalImageUrl={DEMO_IMAGE}
                description={DEMO_DESCRIPTION}
                onRevealComplete={handleRevealComplete}
              />
            </motion.div>
          )}

          {/* Step 3: Style */}
          {step === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StyleQuizBubbles
                onSelectionComplete={handleStyleSelection}
                maxSelections={3}
              />
            </motion.div>
          )}

          {/* Step 4: Fate */}
          {step === 'fate' && (
            <motion.div
              key="fate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProjectFateCard
                difficultyScore={4}
                projectDescription={DEMO_DESCRIPTION}
                estimatedCostRange={{ low: 8500, high: 15000 }}
                onPathSelected={handlePathSelected}
                onSaveToVisionBoard={handleSaveToVisionBoard}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Navigation */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Ready to try with your own photos?</h3>
              <p className="text-sm text-slate-600">
                The real Naili experience works with any room in your home
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('upload')}
                className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Restart Demo
              </button>
              <Link
                href="/vision/start"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] px-6 py-2.5 font-semibold text-white hover:shadow-lg"
              >
                Upload Your Own Photo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Clarification Modal */}
      <ClarificationModal
        isOpen={showClarificationModal}
        onClose={() => setShowClarificationModal(false)}
        onComplete={handleClarificationComplete}
        projectDescription={DEMO_DESCRIPTION}
      />
    </div>
  );
}
