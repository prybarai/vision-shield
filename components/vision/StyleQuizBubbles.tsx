'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StyleOption {
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    emoji: '🌿',
    label: 'Zen Den',
    description: 'Calm, natural, minimalist',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
  },
  {
    emoji: '🎬',
    label: 'Movie Night',
    description: 'Cozy, cinematic, immersive',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    emoji: '☕',
    label: 'Coffee Bar',
    description: 'Social, warm, inviting',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    emoji: '🧘',
    label: 'Yoga Studio',
    description: 'Open, peaceful, balanced',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
  },
  {
    emoji: '🛠️',
    label: 'Workshop',
    description: 'Functional, organized, durable',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
  },
  {
    emoji: '📚',
    label: 'Library',
    description: 'Quiet, intellectual, cozy',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
  },
  {
    emoji: '🎨',
    label: 'Art Studio',
    description: 'Creative, bright, inspiring',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
  },
  {
    emoji: '🎮',
    label: 'Game Room',
    description: 'Fun, energetic, tech-forward',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
];

interface StyleQuizBubblesProps {
  onSelectionComplete?: (selectedStyles: StyleOption[]) => void;
  maxSelections?: number;
  className?: string;
}

export default function StyleQuizBubbles({
  onSelectionComplete,
  maxSelections = 3,
  className,
}: StyleQuizBubblesProps) {
  const [selectedStyles, setSelectedStyles] = useState<StyleOption[]>([]);

  const toggleStyle = (style: StyleOption) => {
    const isSelected = selectedStyles.some((s) => s.label === style.label);
    
    if (isSelected) {
      setSelectedStyles(selectedStyles.filter((s) => s.label !== style.label));
    } else {
      if (selectedStyles.length < maxSelections) {
        setSelectedStyles([...selectedStyles, style]);
      }
    }
  };

  const handleComplete = () => {
    if (selectedStyles.length > 0 && onSelectionComplete) {
      onSelectionComplete(selectedStyles);
    }
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1f7cf7]/10 to-[#48c7f1]/10 px-4 py-2"
        >
          <span className="text-sm font-semibold text-[#1f7cf7]">Quick personality test</span>
        </motion.div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Pick {maxSelections} vibes for this space
        </h2>
        <p className="mt-2 text-slate-600">
          This helps Naili understand your personal style and create a custom mood board
        </p>
      </div>

      {/* Style Bubbles Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STYLE_OPTIONS.map((style, index) => {
          const isSelected = selectedStyles.some((s) => s.label === style.label);
          const isDisabled = selectedStyles.length >= maxSelections && !isSelected;

          return (
            <motion.button
              key={style.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              onClick={() => toggleStyle(style)}
              disabled={isDisabled}
              className={cn(
                'relative rounded-2xl p-4 text-left transition-all duration-200',
                'border-2',
                isSelected
                  ? 'border-[#1f7cf7] bg-white shadow-lg'
                  : 'border-transparent',
                isDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:shadow-md',
                style.bgColor
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1f7cf7]">
                  <span className="text-sm font-bold text-white">✓</span>
                </div>
              )}

              {/* Emoji */}
              <div className="mb-3 text-3xl">{style.emoji}</div>

              {/* Label */}
              <h3 className={cn('text-lg font-bold', style.color)}>{style.label}</h3>

              {/* Description */}
              <p className="mt-1 text-sm text-slate-600">{style.description}</p>

              {/* Disabled Overlay */}
              {isDisabled && !isSelected && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
                  <span className="text-sm font-medium text-slate-500">Max {maxSelections} selected</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection Counter */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedStyles.length} of {maxSelections} selected
          </span>
          {selectedStyles.length > 0 && (
            <span className="h-2 w-2 rounded-full bg-[#1f7cf7]"></span>
          )}
        </div>
      </div>

      {/* Complete Button */}
      {selectedStyles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleComplete}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
          >
            <span>Create my mood board with these vibes</span>
            <span className="text-xl">✨</span>
          </button>
          <p className="mt-2 text-sm text-slate-500">
            Your selection will customize the estimate and contractor brief
          </p>
        </motion.div>
      )}

      {/* Selected Styles Preview */}
      {selectedStyles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5"
        >
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Your space personality
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedStyles.map((style) => (
              <div
                key={style.label}
                className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm"
              >
                <span className="text-lg">{style.emoji}</span>
                <span className="text-sm font-medium text-slate-700">{style.label}</span>
                <button
                  onClick={() => toggleStyle(style)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
