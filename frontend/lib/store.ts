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
  testCases: TestCase[];
  testResults: Map<string, TestResult>;
  
  // UI State
  isLoading: boolean;
  loadingMessage: string;
  statusMessages: StatusMessage[];
  selectedElement: SelectedElement;
  panelView: PanelView;
  highlightedElements: Set<string>;
  isTestingInProgress: boolean;
  currentTestIndex: number;
  
  // Actions
  setAgentData: (data: AgentData) => void;
  setTestCases: (cases: TestCase[]) => void;
  addTestResult: (result: TestResult) => void;
  setLoading: (loading: boolean, message?: string) => void;
  addStatusMessage: (message: Omit<StatusMessage, 'id' | 'timestamp'>) => void;
  setSelectedElement: (element: SelectedElement) => void;
  setPanelView: (view: PanelView) => void;
  highlightElements: (elementIds: string[]) => void;
  clearHighlights: () => void;
  startTesting: () => void;
  stopTesting: () => void;
  setCurrentTestIndex: (index: number) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  agentData: null,
  testCases: [],
  testResults: new Map(),
  isLoading: false,
  loadingMessage: '',
  statusMessages: [],
  selectedElement: null,
  panelView: 'status',
  highlightedElements: new Set(),
  isTestingInProgress: false,
  currentTestIndex: -1,

  // Actions
  setAgentData: (data) => set({ agentData: data }),
  
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
  
  startTesting: () =>
    set({ isTestingInProgress: true, currentTestIndex: 0 }),
  
  stopTesting: () =>
    set({ isTestingInProgress: false, currentTestIndex: -1 }),
  
  setCurrentTestIndex: (index) => set({ currentTestIndex: index }),
  
  reset: () =>
    set({
      agentData: null,
      testCases: [],
      testResults: new Map(),
      isLoading: false,
      loadingMessage: '',
      statusMessages: [],
      selectedElement: null,
      panelView: 'status',
      highlightedElements: new Set(),
      isTestingInProgress: false,
      currentTestIndex: -1,
    }),
}));
