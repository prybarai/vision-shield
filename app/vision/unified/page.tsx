'use client';

import { ProjectProvider } from '@/lib/ProjectContext';
import StepNavigator from '@/components/vision/StepNavigator';
import ProjectAutoSaver from '@/components/vision/ProjectAutoSaver';
import ImageUpload from '@/components/vision/ImageUpload';
import VisionReveal from '@/components/vision/VisionReveal';
import StyleQuizBubbles from '@/components/vision/StyleQuizBubbles';
import ProjectFateCard from '@/components/vision/ProjectFateCard';
import ClarificationModal from '@/components/vision/ClarificationModal';
import MaterialsCart from '@/components/vision/MaterialsCart';
import { useProject, useProjectActions } from '@/lib/ProjectContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

function UnifiedFlowContent() {
  const { state, goToStep } = useProject();
  const { setUploadedImage, setUserDescription } = useProjectActions();
  const [showClarificationModal, setShowClarificationModal] = useState(false);

  const handleUploadComplete = (imageUrl: string) => {
    goToStep('quiz');
  };

  const handleStyleSelection = (styles: any[]) => {
    // Styles are handled by context
    goToStep('clarify');
  };

  const handleClarificationComplete = (answers: Record<string, string>) => {
    // Answers are handled by context
    goToStep('reveal');
  };

  const handlePathSelected = (path: 'diy' | 'pro') => {
    setShowClarificationModal(true);
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'upload':
        return (
          <ImageUpload onUploadComplete={handleUploadComplete} />
        );

      case 'quiz':
        return (
          <StyleQuizBubbles
            onSelectionComplete={handleStyleSelection}
            maxSelections={3}
          />
        );

      case 'clarify':
        return (
          <div className="text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E3A8A]/10 to-[#FF6B35]/10 px-4 py-2">
                <span className="text-sm font-semibold text-[#1E3A8A]">Step 3: Clarify Details</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                Answer 2 quick questions
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                This helps Naili give you a super-accurate estimate
              </p>

              <div className="mt-10">
                <button
                  onClick={() => setShowClarificationModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#FF6B35] px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                >
                  Start Clarification Questions
                </button>
                
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <h4 className="mb-3 font-semibold text-slate-900">Why these questions matter</h4>
                  <ul className="space-y-3 text-left text-sm text-slate-700">
                    <li className="flex gap-3">
                      <span className="text-[#1E3A8A]">🎯</span>
                      <span><strong>Better Estimates:</strong> Accurate scope = accurate pricing</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#1E3A8A]">🤝</span>
                      <span><strong>Contractor Alignment:</strong> Your answers appear in the brief you share</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#1E3A8A]">⏱️</span>
                      <span><strong>Time Savings:</strong> Fewer back-and-forth questions later</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reveal':
        return <VisionReveal />;

      case 'decision':
        return (
          <div className="space-y-8">
            <ProjectFateCard
              difficultyScore={4}
              projectDescription={state.userDescription || 'Your project'}
              estimatedCostRange={state.estimateRange || { low: 8500, high: 15000 }}
              onPathSelected={handlePathSelected}
              onSaveToVisionBoard={() => goToStep('saved')}
            />
            
            {state.userPath === 'diy' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MaterialsCart />
              </motion.div>
            )}
          </div>
        );

      case 'saved':
        return (
          <div className="text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-4 py-2">
                <span className="text-sm font-semibold text-emerald-700">🎉 PROJECT SAVED</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                Your project is saved to your Vision Board!
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                You can access it anytime from "My Projects" in the navigation.
              </p>

              <div className="mt-10">
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8">
                  <h3 className="mb-4 text-xl font-semibold text-emerald-900">What's next?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-2">
                        <span className="text-emerald-600">📋</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">Review your materials list</div>
                        <div className="text-sm text-slate-600">Shop for DIY supplies or share with contractors</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-2">
                        <span className="text-emerald-600">👥</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">Find contractors</div>
                        <div className="text-sm text-slate-600">Share your project brief with local professionals</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-2">
                        <span className="text-emerald-600">📈</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">Track progress</div>
                        <div className="text-sm text-slate-600">Update your vision board as your project evolves</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                  <button
                    onClick={() => goToStep('upload')}
                    className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Start New Project
                  </button>
                  <button
                    onClick={() => window.location.href = '/my-projects'}
                    className="rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#FF6B35] px-6 py-3 font-semibold text-white hover:shadow-lg"
                  >
                    View My Vision Board
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderStepContent()}
      
      <ClarificationModal
        isOpen={showClarificationModal}
        onClose={() => setShowClarificationModal(false)}
        onComplete={handleClarificationComplete}
        projectDescription={state.userDescription || 'Your project'}
      />
    </>
  );
}

export default function UnifiedFlowPage() {
  return (
    <ProjectProvider>
      <StepNavigator>
        <UnifiedFlowContent />
        <ProjectAutoSaver />
      </StepNavigator>
    </ProjectProvider>
  );
}
