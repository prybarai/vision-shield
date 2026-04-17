'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Download,
  Edit,
  Filter,
  Hammer,
  Plus,
  Trash2,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useProjectStorage } from '@/lib/hooks/useProjectStorage';
import { cn } from '@/lib/utils';

export default function MyProjectsPage() {
  const {
    projects,
    isInitialized,
    deleteProject,
    clearAllProjects,
    exportProjects,
    importProjects,
    getProjectStats,
  } = useProjectStorage();

  const [filter, setFilter] = useState<'all' | 'diy' | 'pro'>('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    return project.selectedPath === filter;
  });

  const stats = getProjectStats();

  const handleImport = () => {
    setImportError(null);
    const result = importProjects(importJson);
    if (result.success) {
      setImportModalOpen(false);
      setImportJson('');
      alert(`Successfully imported ${result.count} projects!`);
    } else {
      setImportError(result.error || 'Failed to import projects');
    }
  };

  const handleExport = () => {
    const success = exportProjects();
    if (success) {
      alert('Projects exported successfully!');
    } else {
      alert('Failed to export projects.');
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eef8ff]">
            <Zap className="h-6 w-6 text-[#1f7cf7] animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Loading your vision board...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">My Naili Vision Board</h1>
              <p className="mt-2 text-slate-600">
                Your saved projects, DIY plans, and contractor matches in one place
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/vision/start"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] px-5 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Link>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition-all hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>

              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition-all hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">{stats.totalProjects}</div>
              <div className="text-sm text-slate-600">Total Projects</div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-emerald-700">{stats.diyCount}</div>
              <div className="text-sm text-slate-600">DIY Plans</div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-[#1f7cf7]">{stats.proCount}</div>
              <div className="text-sm text-slate-600">Pro Matches</div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">
                ${stats.totalEstimatedCost.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Total Estimated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filter by:</span>
            </div>
            {['all', 'diy', 'pro'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
                  filter === filterType
                    ? 'bg-[#1f7cf7] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                )}
              >
                {filterType === 'all' && 'All Projects'}
                {filterType === 'diy' && 'DIY Plans'}
                {filterType === 'pro' && 'Pro Matches'}
              </button>
            ))}

            {projects.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all projects from your vision board?')) {
                    clearAllProjects();
                  }
                }}
                className="ml-auto flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg"
                >
                  {/* Project Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Image
                      src={project.photoUrl}
                      alt={project.description}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Path Badge */}
                    <div className="absolute top-3 left-3">
                      <div
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-bold text-white',
                          project.selectedPath === 'diy'
                            ? 'bg-emerald-600'
                            : 'bg-[#1f7cf7]'
                        )}
                      >
                        {project.selectedPath === 'diy' ? 'DIY' : 'PRO'}
                      </div>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="rounded-full bg-white/90 p-2 text-slate-700 hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-5">
                    <h3 className="line-clamp-2 font-semibold text-slate-900">
                      {project.description.length > 60
                        ? `${project.description.substring(0, 60)}...`
                        : project.description}
                    </h3>

                    {/* Style Vibes */}
                    {project.styleVibes && project.styleVibes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {project.styleVibes.slice(0, 3).map((vibe, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                          >
                            {vibe}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cost Range */}
                    {project.costRange && (
                      <div className="mt-4">
                        <div className="text-sm text-slate-500">Estimated Cost</div>
                        <div className="text-lg font-bold text-slate-900">
                          ${project.costRange.low.toLocaleString()} - ${project.costRange.high.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Difficulty */}
                    {project.difficultyScore && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Difficulty</span>
                          <span className="font-medium">
                            {project.difficultyScore <= 3 ? 'Easy' :
                             project.difficultyScore <= 6 ? 'Moderate' : 'Complex'}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              project.difficultyScore <= 3 ? 'bg-emerald-500' :
                              project.difficultyScore <= 6 ? 'bg-amber-500' : 'bg-rose-500'
                            )}
                            style={{ width: `${project.difficultyScore * 10}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>

                      <button className="flex items-center gap-1 text-sm font-medium text-[#1f7cf7] hover:text-[#0f5fc6]">
                        Resume
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center"
          >
            <div className="mx-auto max-w-md">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Zap className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">Your vision board is empty</h3>
              <p className="mb-8 text-slate-600">
                Start by uploading a photo and creating your first project plan. Save DIY shopping lists, pro matches, and style concepts here.
              </p>
              <Link
                href="/vision/start"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f7cf7] to-[#48c7f1] px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Create Your First Project
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="mb-4 text-xl font-bold text-slate-900">Import Projects</h3>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Paste JSON export
                </label>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="h-48 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm"
                  placeholder='[{"photoUrl": "https://...", "description": "...", ...}]'
                />
              </div>

              {importError && (
                <div className="mb-4 rounded-xl bg-rose-50 p-3">
                  <p className="text-sm text-rose-700">{importError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportJson('');
                    setImportError(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="rounded-xl bg-[#1f7cf7] px-4 py-2 font-medium text-white hover:bg-[#0f5fc6] disabled:opacity-50"
                >
                  Import Projects
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
