'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// Types
export interface ProjectState {
  // Raw Inputs
  uploadedImage: string | null;
  userDescription: string;
  
  // Clarification Answers (from Modal)
  clarifications: {
    wallCondition: 'keep' | 'remove' | 'paint' | null;
    floorCondition: 'keep' | 'replace' | 'refinish' | null;
    timeline: 'asap' | 'month' | 'dreaming' | null;
    [key: string]: string | null;
  };
  
  // Style Quiz Results
  selectedVibes: string[]; // ['Zen Den', 'Coffee Bar']
  
  // AI Generated Output
  estimateRange: { low: number; high: number; confidence: number } | null;
  conceptImageUrl: string | null;
  materialsList: Array<{ name: string; price: number; link: string; quantity: number; retailer: 'home_depot' | 'lowes' | 'amazon' }> | null;
  
  // Decision Fork
  userPath: 'diy' | 'pro' | 'undecided' | null;
  
  // UI State
  currentStep: 'upload' | 'quiz' | 'clarify' | 'reveal' | 'decision' | 'saved';
  isLoading: boolean;
  errorMessage: string | null;
}

export type ProjectAction =
  | { type: 'SET_UPLOADED_IMAGE'; payload: string }
  | { type: 'SET_USER_DESCRIPTION'; payload: string }
  | { type: 'SET_CLARIFICATION'; payload: { key: string; value: string | null } }
  | { type: 'SET_SELECTED_VIBES'; payload: string[] }
  | { type: 'SET_ESTIMATE_RANGE'; payload: { low: number; high: number; confidence: number } }
  | { type: 'SET_CONCEPT_IMAGE'; payload: string }
  | { type: 'SET_MATERIALS_LIST'; payload: Array<{ name: string; price: number; link: string; quantity: number; retailer: 'home_depot' | 'lowes' | 'amazon' }> }
  | { type: 'SET_USER_PATH'; payload: 'diy' | 'pro' | 'undecided' }
  | { type: 'SET_CURRENT_STEP'; payload: ProjectState['currentStep'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_PROJECT' }
  | { type: 'LOAD_DRAFT'; payload: Partial<ProjectState> };

const initialState: ProjectState = {
  uploadedImage: null,
  userDescription: '',
  clarifications: {
    wallCondition: null,
    floorCondition: null,
    timeline: null,
  },
  selectedVibes: [],
  estimateRange: null,
  conceptImageUrl: null,
  materialsList: null,
  userPath: null,
  currentStep: 'upload',
  isLoading: false,
  errorMessage: null,
};

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    
    case 'SET_USER_DESCRIPTION':
      return { ...state, userDescription: action.payload };
    
    case 'SET_CLARIFICATION':
      return {
        ...state,
        clarifications: {
          ...state.clarifications,
          [action.payload.key]: action.payload.value,
        },
      };
    
    case 'SET_SELECTED_VIBES':
      return { ...state, selectedVibes: action.payload };
    
    case 'SET_ESTIMATE_RANGE':
      return { ...state, estimateRange: action.payload };
    
    case 'SET_CONCEPT_IMAGE':
      return { ...state, conceptImageUrl: action.payload };
    
    case 'SET_MATERIALS_LIST':
      return { ...state, materialsList: action.payload };
    
    case 'SET_USER_PATH':
      return { ...state, userPath: action.payload };
    
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, errorMessage: action.payload };
    
    case 'RESET_PROJECT':
      return initialState;
    
    case 'LOAD_DRAFT':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

// Context
const ProjectContext = createContext<{
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  goToStep: (step: ProjectState['currentStep']) => void;
  goBack: () => void;
  saveDraft: () => void;
  loadDraft: () => Partial<ProjectState> | null;
} | undefined>(undefined);

// Provider
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  const goToStep = useCallback((step: ProjectState['currentStep']) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  const goBack = useCallback(() => {
    const steps: ProjectState['currentStep'][] = ['upload', 'quiz', 'clarify', 'reveal', 'decision', 'saved'];
    const currentIndex = steps.indexOf(state.currentStep);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  }, [state.currentStep, goToStep]);

  const saveDraft = useCallback(() => {
    const draft = {
      ...state,
      // Don't save loading/error states
      isLoading: false,
      errorMessage: null,
    };
    localStorage.setItem(`naili_draft_${Date.now()}`, JSON.stringify(draft));
    // Keep only the 3 most recent drafts
    const keys = Object.keys(localStorage).filter(key => key.startsWith('naili_draft_'));
    if (keys.length > 3) {
      keys.sort().slice(0, -3).forEach(key => localStorage.removeItem(key));
    }
  }, [state]);

  const loadDraft = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('naili_draft_'));
    if (keys.length === 0) return null;
    
    const latestKey = keys.sort().pop()!;
    const draft = localStorage.getItem(latestKey);
    if (!draft) return null;
    
    try {
      const parsed = JSON.parse(draft);
      // Remove the draft after loading
      localStorage.removeItem(latestKey);
      return parsed;
    } catch {
      return null;
    }
  }, []);

  return (
    <ProjectContext.Provider value={{ state, dispatch, goToStep, goBack, saveDraft, loadDraft }}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Helper hooks for common actions
export function useProjectActions() {
  const { dispatch } = useProject();
  
  return {
    setUploadedImage: (imageUrl: string) => 
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: imageUrl }),
    
    setUserDescription: (description: string) => 
      dispatch({ type: 'SET_USER_DESCRIPTION', payload: description }),
    
    setClarification: (key: string, value: string | null) => 
      dispatch({ type: 'SET_CLARIFICATION', payload: { key, value } }),
    
    setSelectedVibes: (vibes: string[]) => 
      dispatch({ type: 'SET_SELECTED_VIBES', payload: vibes }),
    
    setEstimateRange: (range: { low: number; high: number; confidence: number }) => 
      dispatch({ type: 'SET_ESTIMATE_RANGE', payload: range }),
    
    setConceptImage: (imageUrl: string) => 
      dispatch({ type: 'SET_CONCEPT_IMAGE', payload: imageUrl }),
    
    setMaterialsList: (list: Array<{ name: string; price: number; link: string; quantity: number; retailer: 'home_depot' | 'lowes' | 'amazon' }>) => 
      dispatch({ type: 'SET_MATERIALS_LIST', payload: list }),
    
    setUserPath: (path: 'diy' | 'pro' | 'undecided') => 
      dispatch({ type: 'SET_USER_PATH', payload: path }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
    
    resetProject: () => 
      dispatch({ type: 'RESET_PROJECT' }),
  };
}
