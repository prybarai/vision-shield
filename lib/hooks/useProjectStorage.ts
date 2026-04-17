'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SavedProject {
  id: string;
  photoUrl: string;
  description: string;
  costRange?: { low: number; high: number };
  difficultyScore?: number;
  selectedPath?: 'diy' | 'pro';
  createdAt: string;
  updatedAt: string;
  styleVibes?: string[];
  materialsCart?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

const STORAGE_KEY = 'naili_vision_board_projects';

export function useProjectStorage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProjects(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
      setProjects([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      } catch (error) {
        console.error('Failed to save projects to localStorage:', error);
      }
    }
  }, [projects, isInitialized]);

  const saveProject = useCallback((project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: SavedProject = {
      ...project,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => {
      // Check if similar project already exists (same photo URL and similar description)
      const existingIndex = prev.findIndex(
        (p) =>
          p.photoUrl === newProject.photoUrl &&
          Math.abs(p.description.length - newProject.description.length) < 20
      );

      if (existingIndex >= 0) {
        // Update existing project
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...newProject,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        // Add new project
        return [newProject, ...prev].slice(0, 50); // Limit to 50 projects
      }
    });

    return newProject.id;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<SavedProject>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : project
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }, []);

  const clearAllProjects = useCallback(() => {
    setProjects([]);
  }, []);

  const getProject = useCallback(
    (id: string) => {
      return projects.find((project) => project.id === id);
    },
    [projects]
  );

  const exportProjects = useCallback(() => {
    try {
      const dataStr = JSON.stringify(projects, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `naili-projects-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      return true;
    } catch (error) {
      console.error('Failed to export projects:', error);
      return false;
    }
  }, [projects]);

  const importProjects = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        // Validate imported data structure
        const validProjects = imported.filter(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.photoUrl === 'string' &&
            typeof item.description === 'string'
        );
        
        setProjects((prev) => {
          const merged = [...validProjects, ...prev];
          // Remove duplicates by photoUrl + description
          const unique = merged.filter(
            (project, index, self) =>
              index === self.findIndex(
                (p) => p.photoUrl === project.photoUrl && p.description === project.description
              )
          );
          return unique.slice(0, 50);
        });
        
        return { success: true, count: validProjects.length };
      }
      return { success: false, error: 'Invalid format' };
    } catch (error) {
      return { success: false, error: 'Failed to parse JSON' };
    }
  }, []);

  const getProjectStats = useCallback(() => {
    const totalCost = projects.reduce((sum, project) => {
      if (project.costRange) {
        return sum + (project.costRange.low + project.costRange.high) / 2;
      }
      return sum;
    }, 0);

    const diyCount = projects.filter((p) => p.selectedPath === 'diy').length;
    const proCount = projects.filter((p) => p.selectedPath === 'pro').length;

    const styleCounts: Record<string, number> = {};
    projects.forEach((project) => {
      project.styleVibes?.forEach((vibe) => {
        styleCounts[vibe] = (styleCounts[vibe] || 0) + 1;
      });
    });

    const mostCommonStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      totalProjects: projects.length,
      totalEstimatedCost: totalCost,
      diyCount,
      proCount,
      mostCommonStyle,
      oldestProject: projects.length > 0 ? projects[projects.length - 1]?.createdAt : null,
      newestProject: projects.length > 0 ? projects[0]?.createdAt : null,
    };
  }, [projects]);

  return {
    projects,
    isInitialized,
    saveProject,
    updateProject,
    deleteProject,
    clearAllProjects,
    getProject,
    exportProjects,
    importProjects,
    getProjectStats,
  };
}
