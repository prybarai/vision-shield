'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Users, ShoppingCart, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import MaterialsCart from './MaterialsCart';
import { cn } from '@/lib/utils';

interface ProjectFateCardProps {
  difficultyScore: number; // 1-10
  projectDescription: string;
  estimatedCostRange?: { low: number; high: number };
  onPathSelected?: (path: 'diy' | 'pro') => void;
  onSaveToVisionBoard?: () => void;
  className?: string;
}

export default function ProjectFateCard({
  difficultyScore,
  projectDescription,
  estimatedCostRange,
  onPathSelected,
  onSaveToVisionBoard,
  className,
}: ProjectFateCardProps) {
  const [selectedPath, setSelectedPath] = useState<'diy' | 'pro' | null>(null);
  const [showMaterialsCart, setShowMaterialsCart] = useState(false);

  const isDIYPath = difficultyScore <= 6;
  const difficultyLabel = difficultyScore <= 3 ? 'Easy' : difficultyScore <= 6 ? 'Moderate' : 'Complex';

  const handlePathSelect = (path: 'diy' | 'pro') => {
    setSelectedPath(path);
    if (path === 'diy') {
      setShowMaterialsCart(true);
    }
    onPathSelected?.(path);
  };

  const handleSaveToVisionBoard = () => {
    onSaveToVisionBoard?.();
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Difficulty Score Display */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1f7cf7]/10 to-[#48c7f1]/10 px-4 py-2">
          <Sparkles className="h-4 w-4 text-[#1f7cf7]" />
          <span className="text-sm font-semibold text-[#1f7cf7]">Naili Verdict</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          The fate of your project
        </h2>
        <p className="mt-2 text-slate-600">
          Based on your photo and description, here's what Naili recommends
        </p>
      </div>

      {/* Difficulty Scale */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Difficulty Scale</span>
          <span className="text-sm font-bold text-slate-900">{difficultyLabel} ({difficultyScore}/10)</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${difficultyScore * 10}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              difficultyScore <= 3 ? 'bg-emerald-500' :
              difficultyScore <= 6 ? 'bg-amber-500' :
              'bg-rose-500'
            )}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Weekend Warrior</span>
          <span>Handy Homeowner</span>
          <span>Pro Territory</span>
        </div>
      </div>

      {/* Two-Sided Fate Card */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DIY Hero Path */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            'rounded-2xl border-2 p-6 transition-all',
            isDIYPath
              ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-lg'
              : 'border-slate-200 bg-slate-50'
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Hammer className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">DIY Hero Path</h3>
              <p className="text-sm text-slate-600">You've got this!</p>
            </div>
          </div>

          {isDIYPath ? (
            <>
              <div className="mb-4 rounded-xl bg-white p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">Naili says: Perfect for DIY</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  This project matches common DIY success stories. With the right materials and a weekend, you can transform this space yourself.
                </p>
              </div>

              <button
                onClick={() => handlePathSelect('diy')}
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg"
              >
                Unlock the Shopping List
              </button>
            </>
          ) : (
            <div className="rounded-xl bg-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Better left to pros</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                This project involves complexity or safety considerations that make professional help the smarter choice.
              </p>
            </div>
          )}
        </motion.div>

        {/* Pro Path */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={cn(
            'rounded-2xl border-2 p-6 transition-all',
            !isDIYPath
              ? 'border-[#1f7cf7] bg-gradient-to-br from-[#eef8ff] to-white shadow-lg'
              : 'border-slate-200 bg-slate-50'
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-[#eef8ff] p-2.5">
              <Users className="h-6 w-6 text-[#1f7cf7]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Pro Path</h3>
              <p className="text-sm text-slate-600">Worth the experts</p>
            </div>
          </div>

          {!isDIYPath ? (
            <>
              <div className="mb-4 rounded-xl bg-white p-4">
                <div className="flex items-center gap-2 text-[#1f7cf7]">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">Naili says: Pros recommended</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  This scope benefits from professional skills, tools, and experience. Get matched with vetted local contractors who specialize in this work.
                </p>
              </div>

              <button
                onClick={() => handlePathSelect('pro')}
                className="w-full rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] py-3 font-semibold text-white transition-all hover:shadow-lg"
              >
                Meet the Local Legends
              </button>
            </>
          ) : (
            <div className="rounded-xl bg-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Optional pro help</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                You could DIY this, but if you prefer professional results or have a tight timeline, contractors are available.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Estimated Cost Range */}
      {estimatedCostRange && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Estimated Investment
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                ${estimatedCostRange.low.toLocaleString()} - ${estimatedCostRange.high.toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Based on similar projects in your area
              </p>
            </div>
            {selectedPath === 'diy' && (
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-700">
                  Save ~${Math.round((estimatedCostRange.high - estimatedCostRange.low) * 0.6).toLocaleString()}
                </div>
                <p className="text-sm text-slate-600">by going DIY</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Materials Cart (for DIY path) */}
      <AnimatePresence>
        {showMaterialsCart && selectedPath === 'diy' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <MaterialsCart projectDescription={projectDescription} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save to Vision Board Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 text-center"
      >
        <button
          onClick={handleSaveToVisionBoard}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition-all hover:border-[#1f7cf7] hover:bg-[#f8fbff] hover:text-[#1f7cf7]"
        >
          <ShoppingCart className="h-4 w-4" />
          Save this plan to my Naili Vision Board
        </button>
        <p className="mt-2 text-sm text-slate-500">
          Free accountless dashboard • Access anytime • Compare multiple projects
        </p>
      </motion.div>

      {/* Selected Path Confirmation */}
      <AnimatePresence>
        {selectedPath && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  You selected the {selectedPath === 'diy' ? 'DIY Hero' : 'Pro'} path
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPath === 'diy'
                    ? 'Ready to shop materials and start your project?'
                    : 'Ready to meet contractors who specialize in this work?'}
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
                {selectedPath === 'diy' ? 'Start Shopping' : 'View Matches'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
