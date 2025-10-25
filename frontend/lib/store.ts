import { create } from 'zustand';
import {
  AgentData,
  TestCase,
  TestResult,
  StatusMessage,
  SelectedElement,
  PanelView,
} from '@/types';

interface AppState {
  // Data
  agentData: AgentData | null;
  currentRepoUrl: string | null;
  currentAnalysisId: string | null;
  testCases: TestCase[];
  testResults: Map<string, TestResult>;
  analysisSteps: any[];
  fromCache: boolean;
  
  // Testing Session
  testingSessionId: string | null;
  testingStatus: 'idle' | 'generating' | 'ready_for_confirmation' | 'running_tests' | 'completed';
  testingProgress: any[];
  testReport: any | null;
  pendingTestCases: TestCase[];
  
  // UI State
  isLoading: boolean;
  loadingMessage: string;
  statusMessages: StatusMessage[];
  selectedElement: SelectedElement;
  panelView: PanelView;
  highlightedElements: Set<string>;
  errorHighlightedElements: Set<string>; // For failed/warning tests
  isTestingInProgress: boolean;
  currentTestIndex: number;
  
  // Change Queue
  queuedChanges: Array<{
    id: string;
    type: 'edit' | 'fix';
    description: string;
    data: any;
    timestamp: number;
  }>;
  
  // Actions
  setAgentData: (data: AgentData, repoUrl?: string, fromCache?: boolean) => void;
  setCurrentAnalysisId: (id: string | null) => void;
  setTestCases: (cases: TestCase[]) => void;
  addTestResult: (result: TestResult) => void;
  setLoading: (loading: boolean, message?: string) => void;
  addStatusMessage: (message: Omit<StatusMessage, 'id' | 'timestamp'>) => void;
  setSelectedElement: (element: SelectedElement) => void;
  setPanelView: (view: PanelView) => void;
  highlightElements: (elementIds: string[]) => void;
  clearHighlights: () => void;
  highlightErrorElements: (elementIds: string[]) => void;
  clearErrorHighlights: () => void;
  startTesting: () => void;
  stopTesting: () => void;
  setCurrentTestIndex: (index: number) => void;
  setAnalysisSteps: (steps: any[] | ((prev: any[]) => any[])) => void;
  
  // Testing Session Actions
  setTestingSessionId: (id: string | null) => void;
  setTestingStatus: (status: 'idle' | 'generating' | 'ready_for_confirmation' | 'running_tests' | 'completed') => void;
  addTestingProgress: (progress: any) => void;
  clearTestingProgress: () => void;
  setTestReport: (report: any) => void;
  setPendingTestCases: (cases: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
  
  // Change Queue Actions
  addQueuedChange: (change: Omit<AppState['queuedChanges'][0], 'id' | 'timestamp'>) => void;
  removeQueuedChange: (id: string) => void;
  clearQueuedChanges: () => void;
  
  loadFromLocalStorage: () => void;
  clearLocalStorage: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  agentData: null,
  currentRepoUrl: null,
  currentAnalysisId: null,
  testCases: [],
  testResults: new Map(),
  analysisSteps: [],
  fromCache: false,
  
  // Testing Session
  testingSessionId: null,
  testingStatus: 'idle',
  testingProgress: [],
  testReport: null,
  pendingTestCases: [],
  
  isLoading: false,
  loadingMessage: '',
  statusMessages: [],
  selectedElement: null,
  panelView: 'status',
  highlightedElements: new Set(),
  errorHighlightedElements: new Set(),
  isTestingInProgress: false,
  currentTestIndex: -1,
  
  // Change Queue
  queuedChanges: [],

  // Actions
  setAgentData: (data, repoUrl?: string, fromCache = false) => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentData', JSON.stringify(data));
      if (repoUrl) {
        localStorage.setItem('currentRepoUrl', repoUrl);
      }
      localStorage.setItem('fromCache', String(fromCache));
      localStorage.setItem('lastAnalysis', new Date().toISOString());
    }
    set({ agentData: data, currentRepoUrl: repoUrl || null, fromCache });
  },
  
  setCurrentAnalysisId: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('currentAnalysisId', id);
      } else {
        localStorage.removeItem('currentAnalysisId');
      }
    }
    set({ currentAnalysisId: id });
  },
  
  setTestCases: (cases) => set({ testCases: cases }),
  
  addTestResult: (result) =>
    set((state) => {
      const newResults = new Map(state.testResults);
      newResults.set(result.test_id, result);
      return { testResults: newResults };
    }),
  
  setLoading: (loading, message = '') =>
    set({ isLoading: loading, loadingMessage: message }),
  
  addStatusMessage: (message) =>
    set((state) => ({
      statusMessages: [
        ...state.statusMessages,
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        },
      ],
    })),
  
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  setPanelView: (view) => set({ panelView: view }),
  
  highlightElements: (elementIds) =>
    set({ highlightedElements: new Set(elementIds) }),
  
  clearHighlights: () => set({ highlightedElements: new Set() }),
  
  highlightErrorElements: (elementIds) =>
    set({ errorHighlightedElements: new Set(elementIds) }),
  
  clearErrorHighlights: () => set({ errorHighlightedElements: new Set() }),
  
  startTesting: () =>
    set({ isTestingInProgress: true, currentTestIndex: 0 }),
  
  stopTesting: () =>
    set({ isTestingInProgress: false, currentTestIndex: -1 }),
  
  setCurrentTestIndex: (index) => set({ currentTestIndex: index }),
  
  setAnalysisSteps: (steps) => 
    set((state) => ({
      analysisSteps: typeof steps === 'function' ? steps(state.analysisSteps) : steps
    })),
  
  // Testing Session Actions
  setTestingSessionId: (id) => set({ testingSessionId: id }),
  
  setTestingStatus: (status) => set({ testingStatus: status }),
  
  addTestingProgress: (progress) =>
    set((state) => ({
      testingProgress: [...state.testingProgress, progress]
    })),
  
  clearTestingProgress: () => set({ testingProgress: [] }),
  
  setTestReport: (report) => set({ testReport: report }),
  
  setPendingTestCases: (cases) => set((state) => ({
    pendingTestCases: typeof cases === 'function' ? cases(state.pendingTestCases || []) : cases
  })),
  
  // Change Queue Actions
  addQueuedChange: (change) =>
    set((state) => ({
      queuedChanges: [
        ...state.queuedChanges,
        {
          ...change,
          id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    })),
  
  removeQueuedChange: (id) =>
    set((state) => ({
      queuedChanges: state.queuedChanges.filter((c) => c.id !== id),
    })),
  
  clearQueuedChanges: () => set({ queuedChanges: [] }),
  
  loadFromLocalStorage: () => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('agentData');
        const savedUrl = localStorage.getItem('currentRepoUrl');
        const savedAnalysisId = localStorage.getItem('currentAnalysisId');
        const savedFromCache = localStorage.getItem('fromCache') === 'true';
        
        if (savedData) {
          const data = JSON.parse(savedData);
          set({ 
            agentData: data, 
            currentRepoUrl: savedUrl,
            currentAnalysisId: savedAnalysisId,
            fromCache: savedFromCache
          });
        } else if (savedAnalysisId) {
          // If we have an analysis ID but no data, we can resume
          set({ currentAnalysisId: savedAnalysisId });
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  },

  clearLocalStorage: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentData');
      localStorage.removeItem('currentRepoUrl');
      localStorage.removeItem('currentAnalysisId');
      localStorage.removeItem('fromCache');
      localStorage.removeItem('lastAnalysis');
    }
  },
  
  reset: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentData');
      localStorage.removeItem('currentRepoUrl');
      localStorage.removeItem('currentAnalysisId');
      localStorage.removeItem('fromCache');
      localStorage.removeItem('lastAnalysis');
    }
    set({
      agentData: null,
      currentRepoUrl: null,
      currentAnalysisId: null,
      testCases: [],
      testResults: new Map(),
      analysisSteps: [],
      fromCache: false,
      isLoading: false,
      loadingMessage: '',
      statusMessages: [],
      selectedElement: null,
      panelView: 'status',
      highlightedElements: new Set(),
      isTestingInProgress: false,
      currentTestIndex: -1,
    });
  },
}));
