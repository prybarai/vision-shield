'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, Hammer, Paintbrush, Ruler, Truck } from 'lucide-react';
import { useProject, useProjectActions } from '@/lib/ProjectContext';
import { cn } from '@/lib/utils';

interface StepNavigatorProps {
  children: React.ReactNode;
  className?: string;
}

const STEP_LABELS: Record<string, { title: string; description: string }> = {
  upload: { title: 'Upload Photo', description: 'Start with a photo of your space' },
  quiz: { title: 'Pick Your Style', description: 'Choose 3 vibes that match your vision' },
  clarify: { title: 'Clarify Details', description: 'Answer a few quick questions' },
  reveal: { title: 'AI Analysis', description: 'Naili is analyzing your space...' },
  decision: { title: 'Your Project Plan', description: 'DIY or professional help?' },
  saved: { title: 'Saved to Vision Board', description: 'Your project is ready to go!' },
};

const LOADING_STEPS = [
  { icon: <Ruler className="h-6 w-6" />, text: 'Measuring dimensions...' },
  { icon: <Hammer className="h-6 w-6" />, text: 'Identifying materials...' },
  { icon: <Paintbrush className="h-6 w-6" />, text: 'Calculating labor costs...' },
  { icon: <Truck className="h-6 w-6" />, text: 'Sourcing local material prices...' },
];

export default function StepNavigator({ children, className }: StepNavigatorProps) {
  const { state, goBack, goToStep } = useProject();
  const { setLoading, setEstimateRange, setConceptImage, setMaterialsList } = useProjectActions();
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const currentStep = state.currentStep;
  const canGoBack = currentStep !== 'upload';
  const isRevealStep = currentStep === 'reveal';

  // Handle step transitions
  useEffect(() => {
    if (currentStep === 'reveal' && !state.isLoading) {
      // Start the AI simulation
      setLoading(true);
      setLoadingProgress(0);
      setCurrentLoadingStep(0);

      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 0.5;
          if (newProgress >= 100) {
            clearInterval(interval);
            
            // Simulate AI completion
            setTimeout(() => {
              setEstimateRange({
                low: Math.floor(Math.random() * 5000) + 3000,
                high: Math.floor(Math.random() * 15000) + 8000,
                confidence: 0.94,
              });
              
              setConceptImage('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80');
              
              setMaterialsList([
                { name: 'Paint Brush Set', price: 14.99, link: 'https://www.homedepot.com/p/...', quantity: 1, retailer: 'home_depot' },
                { name: 'Premium Paint (Gallon)', price: 49.99, link: 'https://www.lowes.com/p/...', quantity: 2, retailer: 'lowes' },
                { name: 'Drop Cloth', price: 12.99, link: 'https://www.amazon.com/...', quantity: 1, retailer: 'amazon' },
                { name: 'Painter\'s Tape', price: 8.99, link: 'https://www.homedepot.com/p/...', quantity: 2, retailer: 'home_depot' },
              ]);
              
              setLoading(false);
              goToStep('decision');
            }, 500);
            
            return 100;
          }
          
          // Update loading step every 25% progress
          if (newProgress >= 25 && currentLoadingStep < 1) setCurrentLoadingStep(1);
          if (newProgress >= 50 && currentLoadingStep < 2) setCurrentLoadingStep(2);
          if (newProgress >= 75 && currentLoadingStep < 3) setCurrentLoadingStep(3);
          
          return newProgress;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [currentStep, state.isLoading, setLoading, setEstimateRange, setConceptImage, setMaterialsList, goToStep, currentLoadingStep]);

  // Progress bar steps
  const steps = ['upload', 'quiz', 'clarify', 'reveal', 'decision'] as const;
  const currentStepIndex = steps.indexOf(currentStep as any);

  return (
    <div className={cn('min-h-screen bg-gradient-to-b from-white to-slate-50', className)}>
      {/* Header with progress */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Back button */}
            {canGoBack && !isRevealStep && (
              <button
                onClick={goBack}
                className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back
              </button>
            )}
            
            {/* Step title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-slate-900">
                {STEP_LABELS[currentStep]?.title || 'Naili Project'}
              </h1>
              <p className="text-sm text-slate-600">
                {STEP_LABELS[currentStep]?.description || 'Create your perfect space'}
              </p>
            </div>

            {/* Spacer for alignment */}
            <div className="w-20" />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                        index < currentStepIndex
                          ? 'bg-emerald-500 text-white'
                          : index === currentStepIndex
                          ? 'bg-[#1f7cf7] text-white ring-4 ring-[#1f7cf7]/20'
                          : 'bg-slate-200 text-slate-500'
                      )}
                    >
                      {index + 1}
                    </div>
                    <span className="mt-2 text-xs font-medium text-slate-600">
                      {STEP_LABELS[step]?.title.split(' ')[0]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-1 flex-1 mx-2 transition-colors',
                        index < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Loading overlay for reveal step */}
      <AnimatePresence>
        {state.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
          >
            <div className="mx-auto max-w-md text-center">
              <div className="mb-8">
                <div className="relative mx-auto h-32 w-32">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-[#1f7cf7]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-[#1f7cf7] animate-pulse" />
                  </div>
                </div>
              </div>

              <h3 className="mb-4 text-2xl font-bold text-slate-900">
                Naili is analyzing your space...
              </h3>

              {/* Loading steps */}
              <div className="mb-8 space-y-4">
                {LOADING_STEPS.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: index <= currentLoadingStep ? 1 : 0.5,
                      x: 0 
                    }}
                    transition={{ delay: index * 0.2 }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-4 transition-all',
                      index <= currentLoadingStep
                        ? 'bg-[#eef8ff] text-[#1f7cf7]'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <div className={cn(
                      'rounded-lg p-2',
                      index <= currentLoadingStep
                        ? 'bg-white text-[#1f7cf7]'
                        : 'bg-slate-200 text-slate-500'
                    )}>
                      {step.icon}
                    </div>
                    <span className="font-medium">{step.text}</span>
                    {index <= currentLoadingStep && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto h-2 w-2 rounded-full bg-emerald-500"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Analyzing your photo</span>
                  <span className="text-slate-600">{Math.round(loadingProgress)}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1]"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <p className="text-sm text-slate-600">
                This usually takes 10-15 seconds. Please don't close this window.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
