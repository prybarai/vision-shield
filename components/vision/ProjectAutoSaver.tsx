'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, RotateCcw } from 'lucide-react';
import { useProject } from '@/lib/ProjectContext';

export default function ProjectAutoSaver() {
  const { state, saveDraft, loadDraft, dispatch } = useProject();
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for existing drafts on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft).length > 0) {
      setShowRecoveryBanner(true);
    }
  }, [loadDraft]);

  // Auto-save every 10 seconds when there are changes
  useEffect(() => {
    // Don't save empty states
    if (!state.uploadedImage && !state.userDescription && state.selectedVibes.length === 0) {
      return;
    }

    const hasChanges = 
      state.uploadedImage !== null ||
      state.userDescription !== '' ||
      state.selectedVibes.length > 0 ||
      Object.values(state.clarifications).some(v => v !== null);

    setHasUnsavedChanges(hasChanges);

    if (!hasChanges) return;

    const saveInterval = setInterval(() => {
      saveDraft();
      setLastSaveTime(Date.now());
      
      // Show subtle save indicator
      const indicator = document.getElementById('save-indicator');
      if (indicator) {
        indicator.classList.remove('opacity-0');
        indicator.classList.add('opacity-100');
        setTimeout(() => {
          indicator.classList.remove('opacity-100');
          indicator.classList.add('opacity-0');
        }, 1000);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(saveInterval);
  }, [state, saveDraft]);

  const handleResumeDraft = () => {
    const draft = loadDraft();
    if (draft) {
      dispatch({ type: 'LOAD_DRAFT', payload: draft });
      setShowRecoveryBanner(false);
    }
  };

  const handleStartNew = () => {
    setShowRecoveryBanner(false);
  };

  const handleManualSave = () => {
    saveDraft();
    setLastSaveTime(Date.now());
    
    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 rounded-xl bg-emerald-500 px-4 py-3 text-white shadow-lg';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <Save className="h-4 w-4" />
        <span class="font-medium">Project saved!</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  return (
    <>
      {/* Save indicator (subtle) */}
      <div
        id="save-indicator"
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm text-slate-600 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300"
      >
        <Save className="h-3 w-3" />
        <span>Auto-saved</span>
      </div>

      {/* Manual save button (floating) */}
      {hasUnsavedChanges && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleManualSave}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#FF6B35] px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </motion.button>
      )}

      {/* Recovery banner */}
      <AnimatePresence>
        {showRecoveryBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2"
          >
            <div className="mx-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-[#eef8ff] p-2">
                    <RotateCcw className="h-5 w-5 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Welcome back!</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      You have an unsaved project. Continue where you left off?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleResumeDraft}
                        className="rounded-lg bg-[#1E3A8A] px-3 py-2 text-sm font-medium text-white hover:bg-[#0f2a6a]"
                      >
                        Resume Project
                      </button>
                      <button
                        onClick={handleStartNew}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Start New
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRecoveryBanner(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last save time tooltip */}
      {lastSaveTime && (
        <div className="fixed bottom-20 right-4 z-30">
          <div className="relative">
            <div className="absolute bottom-full right-0 mb-2 hidden w-48 rounded-lg bg-slate-900 p-3 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <div className="mb-1 font-medium">Last auto-save</div>
              <div className="text-slate-300">
                {new Date(lastSaveTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="mt-2 text-slate-400">
                Naili saves your progress automatically every 10 seconds.
              </div>
              <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-slate-900" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
