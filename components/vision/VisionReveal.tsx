'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Zap, Clock, Target } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface VisionRevealProps {
  originalImageUrl: string;
  description: string;
  className?: string;
  onRevealComplete?: () => void;
}

export default function VisionReveal({
  originalImageUrl,
  description,
  className,
  onRevealComplete,
}: VisionRevealProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Note: Audio ref commented out for now to avoid lint warnings
  // const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate a placeholder concept image URL based on description
  const conceptImageUrl = `https://placehold.co/600x400/1f7cf7/ffffff?text=${encodeURIComponent(
    description.substring(0, 30) + '...'
  )}`;

  useEffect(() => {
    // Simulate LIDAR scan animation
    const scanDuration = 2000; // 2 seconds
    const startTime = Date.now();

    const animateScan = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / scanDuration, 1);
      setScanProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animateScan);
      } else {
        setShowStats(true);
        onRevealComplete?.();
      }
    };

    requestAnimationFrame(animateScan);

    // Draw scan effect on canvas
    const drawScan = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

      // Draw scanning dot
      ctx.fillStyle = '#1f7cf7';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5, scanY, 8, 0, Math.PI * 2);
      ctx.fill();
    };

    const animationFrame = requestAnimationFrame(drawScan);
    return () => cancelAnimationFrame(animationFrame);
  }, [onRevealComplete, scanProgress]);

  const playScanSound = () => {
    if (typeof window !== 'undefined' && !isPlayingSound) {
      setIsPlayingSound(true);
      // Create a simple whoosh sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.8);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.8);

        setTimeout(() => setIsPlayingSound(false), 1000);
      } catch (error) {
        console.log('Audio context not supported');
      }
    }
  };

  const statCards = [
    {
      icon: <Target className="h-5 w-5" />,
      label: 'Materials Identified',
      value: '12',
      color: 'text-[#1f7cf7]',
      bgColor: 'bg-[#eef8ff]',
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: 'Labor Hours Saved',
      value: '18',
      color: 'text-[#48c7f1]',
      bgColor: 'bg-[#f0fcff]',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: 'Naili Confidence',
      value: '94%',
      color: 'text-[#a8eb57]',
      bgColor: 'bg-[#f8ffe6]',
    },
  ];

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto', className)}>
      {/* LIDAR Scan Canvas Overlay */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={800}
          height={600}
        />
        
        {/* Original Image (hidden during scan) */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: scanProgress > 0.95 ? 1 : 0 }}
        >
          <Image
            src={originalImageUrl}
            alt="Original space"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>

        {/* Scan Progress Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-white">
            <Scan className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">
              Scanning space... {Math.round(scanProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Sound Trigger Button */}
        <button
          onClick={playScanSound}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2.5 shadow-lg transition-all hover:scale-105 hover:bg-white"
          disabled={isPlayingSound}
        >
          <Zap className={`h-5 w-5 ${isPlayingSound ? 'text-[#a8eb57]' : 'text-slate-600'}`} />
        </button>
      </div>

      {/* Split-Screen Slider (appears after scan) */}
      <AnimatePresence>
        {scanProgress > 0.95 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <div className="mb-4 text-center">
              <h3 className="text-xl font-bold text-slate-900">Drag to reveal your vision</h3>
              <p className="mt-1 text-sm text-slate-600">
                Slide between your current space and the Naili concept
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200">
              {/* Original Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={originalImageUrl}
                  alt="Original space"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              </div>

              {/* Concept Image */}
              <div
                className="absolute inset-0 w-full h-full"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <Image
                  src={conceptImageUrl}
                  alt="AI concept"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent" />
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={(e) => {
                  const slider = e.currentTarget.parentElement;
                  if (!slider) return;

                  const startX = e.clientX;
                  const startLeft = sliderPosition;

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const sliderWidth = slider.clientWidth;
                    const newPosition = Math.max(0, Math.min(100, startLeft + (deltaX / sliderWidth) * 100));
                    setSliderPosition(newPosition);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1f7cf7] to-[#48c7f1]">
                      <Scan className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1.5 text-white">
                <span className="text-sm font-medium">Your Space</span>
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-white">
                <span className="text-sm font-medium">Naili Concept</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-sm text-slate-600">
              <span>Original</span>
              <span>AI Vision</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Stat Cards */}
      <AnimatePresence>
        {showStats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={cn(
                  'rounded-2xl p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]',
                  stat.bgColor
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-xl p-2.5', stat.bgColor)}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Share Prompt */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-slate-600">
              ✨ This is your shareable moment! Screenshot and tag{' '}
              <span className="font-semibold text-[#1f7cf7]">@naili.ai</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
