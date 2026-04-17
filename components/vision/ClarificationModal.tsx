'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'yes_no' | 'text';
  options?: string[];
  required: boolean;
}

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string>) => void;
  projectDescription: string;
  className?: string;
}

const DEFAULT_QUESTIONS: ClarificationQuestion[] = [
  {
    id: 'wall_texture',
    question: 'What is the current wall texture?',
    type: 'multiple_choice',
    options: ['Smooth drywall', 'Orange peel', 'Knockdown', 'Popcorn', 'Plaster', 'Not sure'],
    required: true,
  },
  {
    id: 'diy_demo',
    question: 'Will you handle demo/cleanup yourself?',
    type: 'yes_no',
    required: false,
  },
  {
    id: 'existing_floor',
    question: 'Are we keeping the existing floor underneath?',
    type: 'yes_no',
    required: true,
  },
  {
    id: 'access_notes',
    question: 'Any access limitations we should know about?',
    type: 'text',
    required: false,
  },
];

export default function ClarificationModal({
  isOpen,
  onClose,
  onComplete,
  projectDescription,
  className,
}: ClarificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = DEFAULT_QUESTIONS[currentStep];
  const isLastStep = currentStep === DEFAULT_QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / DEFAULT_QUESTIONS.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    if (isLastStep) {
      // Don't auto-advance on last step
      return;
    }

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, DEFAULT_QUESTIONS.length - 1));
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Validate required questions
    const missingRequired = DEFAULT_QUESTIONS.filter(
      (q) => q.required && !answers[q.id]
    );
    
    if (missingRequired.length > 0) {
      alert(`Please answer: ${missingRequired.map(q => q.question).join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      onComplete(answers);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              'relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl',
              className
            )}
          >
            {/* Header */}
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#eef8ff] p-2">
                    <HelpCircle className="h-6 w-6 text-[#1f7cf7]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Super-Accurate Estimate</h2>
                    <p className="text-sm text-slate-600">
                      Answer 2 quick questions for a better estimate
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Question {currentStep + 1} of {DEFAULT_QUESTIONS.length}
                  </span>
                  <span className="text-slate-500">{Math.round(progress)}% complete</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Project Context */}
              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">For your project:</p>
                <p className="font-medium text-slate-900">
                  "{projectDescription.length > 80
                    ? `${projectDescription.substring(0, 80)}...`
                    : projectDescription}"
                </p>
              </div>

              {/* Current Question */}
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  {currentQuestion.question}
                  {currentQuestion.required && (
                    <span className="ml-1 text-rose-500">*</span>
                  )}
                </h3>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                    currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all',
                          answers[currentQuestion.id] === option
                            ? 'border-[#1f7cf7] bg-[#eef8ff]'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <span className="font-medium text-slate-900">{option}</span>
                        {answers[currentQuestion.id] === option && (
                          <CheckCircle className="h-5 w-5 text-[#1f7cf7]" />
                        )}
                      </button>
                    ))
                  )}

                  {currentQuestion.type === 'yes_no' && (
                    <div className="grid grid-cols-2 gap-3">
                      {['Yes', 'No'].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          className={cn(
                            'rounded-xl border-2 p-4 text-center font-medium transition-all',
                            answers[currentQuestion.id] === option
                              ? option === 'Yes'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        [currentQuestion.id]: e.target.value
                      }))}
                      className="w-full rounded-xl border border-slate-300 p-4 focus:border-[#1f7cf7] focus:outline-none"
                      rows={3}
                      placeholder="Type your answer here..."
                    />
                  )}
                </div>
              </div>

              {/* Selected Answers Preview */}
              {Object.keys(answers).length > 0 && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Your answers so far
                  </h4>
                  <div className="space-y-2">
                    {DEFAULT_QUESTIONS.slice(0, currentStep + 1).map((q) => {
                      const answer = answers[q.id];
                      if (!answer) return null;
                      
                      return (
                        <div key={q.id} className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          <div>
                            <div className="text-sm font-medium text-slate-700">{q.question}</div>
                            <div className="text-sm text-slate-900">{answer}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={cn(
                    'rounded-xl px-4 py-2 font-medium transition-all',
                    currentStep === 0
                      ? 'text-slate-400'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  ← Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Skip for now
                  </button>

                  {isLastStep ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] px-6 py-2.5 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Get Super-Accurate Estimate'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
                    >
                      Next Question →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <p className="text-center text-sm text-slate-600">
                ✨ These answers will appear in your contractor brief for better communication
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
