'use client';

import { ProjectProvider } from '@/lib/ProjectContext';
import NailiOrchestrator from '@/components/vision/NailiOrchestrator';
import ProjectAutoSaver from '@/components/vision/ProjectAutoSaver';

export default function UnifiedVisionPage() {
  return (
    <ProjectProvider>
      <NailiOrchestrator />
      <ProjectAutoSaver />
    </ProjectProvider>
  );
}