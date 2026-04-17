'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Scan, Zap, Clock, Target, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useProject } from '@/lib/ProjectContext';

interface VisionRevealProps {
  className?: string;
}

export default function VisionReveal({ className }: VisionRevealProps) {
  const { state } = useProject();
  const [scanProgress, setScanProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderX = useMotionValue(50);
  
  // Transform slider position to percentage (0-100)
  const sliderPercentage = useTransform(sliderX, [0, 100], [0, 100]);

  // Original and concept images from context
  const originalImageUrl = state.uploadedImage || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
  const conceptImageUrl = state.conceptImageUrl || `https://placehold.co/600x400/1f7cf7/ffffff?text=${encodeURIComponent(
    (state.userDescription || 'Your Naili Concept').substring(0, 30) + '...'
  )}`;

  // Handle confetti effect when slider reaches 100%
  useEffect(() => {
    const unsubscribe = sliderPercentage.onChange((value) => {
      if (value >= 95 && !hasTriggeredConfetti) {
        setShowConfetti(true);
        setHasTriggeredConfetti(true);
        
        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 2000);
      }
    });
    
    return unsubscribe;
  }, [sliderPercentage, hasTriggeredConfetti]);

  // Draw LIDAR scan effect
  useEffect(() => {
    const drawScan = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match container
      const container = canvas.parentElement;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(72, 199, 241, 0.3)';
      ctx.lineWidth = 1;

      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw scanning line
      const scanY = canvas.height * scanProgress;
      ctx.strokeStyle = '#48c7f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      // Draw scanning dot with glow
      ctx.fillStyle = '#1f7cf7';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5, scanY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = '#1f7cf7';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const animationFrame = requestAnimationFrame(drawScan);
    return () => cancelAnimationFrame(animationFrame);
  }, [scanProgress]);

  // Start LIDAR scan animation
  useEffect(() => {
    if (state.currentStep !== 'reveal') return;

    const scanDuration = 2000;
    const startTime = Date.now();

    const animateScan = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / scanDuration, 1);
      setScanProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animateScan);
      } else {
        setShowStats(true);
      }
    };

    requestAnimationFrame(animateScan);
  }, [state.currentStep]);

  // Confetti effect (simple CSS version)
  const Confetti = () => (
    <div className="pointer-events-none fixed inset-0 z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#FF6B35', '#1E3A8A', '#48c7f1', '#a8eb57'][Math.floor(Math.random() * 4)],
          }}
          initial={{ y: -100, opacity: 0, scale: 0 }}
          animate={{ 
            y: window.innerHeight + 100,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            delay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      {/* Confetti effect */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E3A8A]/10 to-[#FF6B35]/10 px-4 py-2">
          <Scan className="h-4 w-4 text-[#1E3A8A]" />
          <span className="text-sm font-semibold text-[#1E3A8A]">AI SPACE ANALYSIS</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">
          Swipe to see your Naili concept
        </h2>
        <p className="mt-2 text-slate-600">
          Drag the slider to compare your original space with the AI-generated concept
        </p>
      </div>

      {/* Split-screen comparison */}
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border-4 border-white shadow-2xl">
        {/* Canvas overlay for LIDAR effect */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10"
        />

        {/* Images container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Original image */}
          <div className="absolute inset-0">
            <Image
              src={originalImageUrl}
              alt="Original space"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
          </div>

          {/* Concept image with clip-path */}
          <motion.div
            className="absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - sliderPercentage.get()}% 0 0)`,
            }}
          >
            <Image
              src={conceptImageUrl}
              alt="Naili concept"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#1E3A8A]/10 to-transparent" />
          </motion.div>

          {/* Slider handle */}
          <motion.div
            className="absolute top-0 bottom-0 z-20 w-1 cursor-ew-resize bg-gradient-to-b from-[#FF6B35] to-[#1E3A8A]"
            style={{ left: `${sliderPercentage.get()}%` }}
            drag="x"
            dragConstraints={{ left: 0, right: 100 }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={(_, info) => {
              const container = info.point.x - info.offset.x;
              const percentage = (container / window.innerWidth) * 100;
              sliderX.set(Math.max(0, Math.min(100, percentage * 2)));
            }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/50">
                <div className="h-6 w-1 rounded-full bg-gradient-to-b from-[#FF6B35] to-[#1E3A8A]" />
              </div>
            </div>
          </motion.div>

          {/* Labels */}
          <div className="absolute left-6 top-6 z-10 rounded-full bg-white/90 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-semibold text-slate-900">Your Photo</span>
          </div>
          <div className="absolute right-6 top-6 z-10 rounded-full bg-[#1E3A8A]/90 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-semibold text-white">Naili Concept</span>
          </div>

          {/* Accessibility instruction */}
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
            <p className="text-sm text-white" aria-label="Compare original to Naili concept">
              ← Drag to compare →
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { icon: <Target className="h-5 w-5" />, label: 'Materials Identified', value: '12', color: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]/10' },
              { icon: <Clock className="h-5 w-5" />, label: 'Labor Hours Saved', value: '18', color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
              { icon: <Zap className="h-5 w-5" />, label: 'Naili Confidence', value: '94%', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              { icon: <Sparkles className="h-5 w-5" />, label: 'Style Match', value: 'Perfect', color: 'text-purple-600', bg: 'bg-purple-500/10' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${stat.bg} ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="mb-3 font-semibold text-slate-900">How to use this visualization</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="text-[#1E3A8A]">•</span>
            <span><strong>Drag the slider</strong> to compare your original space with the AI concept</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#1E3A8A]">•</span>
            <span><strong>Share this view</strong> with family or contractors to align on vision</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#1E3A8A]">•</span>
            <span><strong>Reach 100% concept view</strong> for a surprise celebration!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
