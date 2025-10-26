import { create } from 'zustand';
import { apiService } from '@/lib/api';
import {
  AgentData,
  TestCase,
  TestResult,
  StatusMessage,
  SelectedElement,
  PanelView,
} from '@/types';
import { TestCollection } from '@/types/collections';

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
  
  // Objective Focus (for cost calculations)
  objectiveFocus: {
    reasoning: number;      // 0-100
    accuracy: number;       // 0-100
    costOptimization: number; // 0-100
    speed: number;          // 0-100
  };
  
  // UI State
  isLoading: boolean;
  loadingMessage: string;
  isGeneratingTests: boolean; // New state for test generation loading
  statusMessages: StatusMessage[];
  selectedElement: SelectedElement;
  panelView: PanelView;
  highlightedElements: Set<string>;
  errorHighlightedElements: Set<string>; // For failed/warning tests
  warningHighlightedElements: Set<string>; // For elements with recommendations/warnings
  isTestingInProgress: boolean;
  currentTestIndex: number;
  currentRunningTestId: string | null; // Track which test is currently running for color coordination
  
  // Test Collections
  testCollections: TestCollection[];
  activeCollectionId: string | null;
  showReportModal: boolean;
  showProgressReport: boolean; // For progress report modal
  currentProgressSessionId: string | null; // Current session in progress report
  visibleSessionIds: string[]; // IDs of sessions currently displayed on canvas
  
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
  setGeneratingTests: (generating: boolean) => void;
  addStatusMessage: (message: Omit<StatusMessage, 'id' | 'timestamp'>) => void;
  setSelectedElement: (element: SelectedElement) => void;
  setPanelView: (view: PanelView) => void;
  highlightElements: (elementIds: string[]) => void;
  clearHighlights: () => void;
  highlightErrorElements: (elementIds: string[]) => void;
  clearErrorHighlights: () => void;
  highlightWarningElements: (elementIds: string[]) => void;
  clearWarningHighlights: () => void;
  startTesting: () => void;
  stopTesting: () => void;
  setCurrentTestIndex: (index: number) => void;
  setCurrentRunningTestId: (testId: string | null) => void;
  setAnalysisSteps: (steps: any[] | ((prev: any[]) => any[])) => void;
  
  // Collection Actions
  addTestCollection: (collection: TestCollection) => void;
  updateTestCollection: (id: string, updates: Partial<TestCollection>) => void;
  deleteTestCollection: (id: string) => void;
  setActiveCollection: (id: string | null) => void;
  setShowReportModal: (show: boolean) => void;
  setShowProgressReport: (show: boolean, sessionId?: string) => void;
  
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
  
  // Fix Management Actions
  acceptFix: (fixId: string, sessionId: string) => void;
  rejectFix: (fixId: string, sessionId: string) => void;
  queueFixApplication: (fix: any) => void;
  hasPendingFixes: () => boolean;
  canExportReport: () => boolean;
  
  // Multi-Session Actions
  addTestSession: (session: any) => void;
  toggleSessionVisibility: (sessionId: string) => void;
  getVisibleSessions: () => string[];
  
  // Objective Focus Actions
  setObjectiveFocus: (focus: Partial<AppState['objectiveFocus']>) => void;
  
  loadFromLocalStorage: () => void;
  clearLocalStorage: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
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
  
  // Objective Focus
  objectiveFocus: {
    reasoning: 50,
    accuracy: 50,
    costOptimization: 50,
    speed: 50,
  },
  
  isLoading: false,
  loadingMessage: '',
  isGeneratingTests: false,
  statusMessages: [],
  selectedElement: null,
  panelView: 'status',
  highlightedElements: new Set(),
  errorHighlightedElements: new Set(),
  warningHighlightedElements: new Set(),
  isTestingInProgress: false,
  currentTestIndex: -1,
  currentRunningTestId: null,
  
  // Test Collections
  testCollections: [],
  activeCollectionId: null,
  showReportModal: false,
  showProgressReport: false,
  currentProgressSessionId: null,
  visibleSessionIds: [],
  
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
  
  setGeneratingTests: (generating) =>
    set({ isGeneratingTests: generating }),
  
  addStatusMessage: (message) =>
    set((state) => ({
      statusMessages: [
        ...state.statusMessages,
        {
          ...message,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  
  highlightWarningElements: (elementIds) =>
    set({ warningHighlightedElements: new Set(elementIds) }),
  
  clearWarningHighlights: () => set({ warningHighlightedElements: new Set() }),
  
  startTesting: () =>
    set({ isTestingInProgress: true, currentTestIndex: 0 }),
  
  stopTesting: () =>
    set({ isTestingInProgress: false, currentTestIndex: -1 }),
  
  setCurrentTestIndex: (index) => set({ currentTestIndex: index }),
  
  setCurrentRunningTestId: (testId) => set({ currentRunningTestId: testId }),
  
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
  
  // Collection Actions
  addTestCollection: (collection) =>
    set((state) => {
      const newCollections = [...state.testCollections, collection];
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('testCollections', JSON.stringify(newCollections));
      }
      return {
        testCollections: newCollections,
        activeCollectionId: collection.id,
      };
    }),
  
  updateTestCollection: (id, updates) =>
    set((state) => {
      const newCollections = state.testCollections.map((col) =>
        col.id === id ? { ...col, ...updates, updatedAt: new Date().toISOString() } : col
      );
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('testCollections', JSON.stringify(newCollections));
      }
      return { testCollections: newCollections };
    }),
  
  deleteTestCollection: (id) =>
    set((state) => {
      const newCollections = state.testCollections.filter((col) => col.id !== id);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('testCollections', JSON.stringify(newCollections));
      }
      return {
        testCollections: newCollections,
        activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId,
      };
    }),
  
  setActiveCollection: (id) => set({ activeCollectionId: id }),
  
  setShowReportModal: (show) => set({ showReportModal: show }),
  
  setShowProgressReport: (show, sessionId) => {
    console.log('[Store] setShowProgressReport called:', { show, sessionId });
    console.log('[Store] Current testCollections:', get().testCollections);
    set({ 
      showProgressReport: show, 
      currentProgressSessionId: sessionId || null 
    });
    console.log('[Store] Updated state:', { 
      showProgressReport: get().showProgressReport, 
      currentProgressSessionId: get().currentProgressSessionId 
    });
  },
  
  loadFromLocalStorage: () => {
    console.log('[Store] loadFromLocalStorage called');
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('agentData');
        const savedUrl = localStorage.getItem('currentRepoUrl');
        const savedAnalysisId = localStorage.getItem('currentAnalysisId');
        const savedFromCache = localStorage.getItem('fromCache') === 'true';
        const savedCollections = localStorage.getItem('testCollections');
        
        console.log('[Store] localStorage values:', {
          savedData: savedData ? 'exists' : 'null',
          savedUrl,
          savedAnalysisId,
          savedFromCache,
          savedCollections: savedCollections ? 'exists' : 'null'
        });
        
        const updates: any = {};
        
        if (savedData) {
          const data = JSON.parse(savedData);
          updates.agentData = data;
          updates.currentRepoUrl = savedUrl;
          updates.currentAnalysisId = savedAnalysisId;
          updates.fromCache = savedFromCache;
        } else if (savedAnalysisId) {
          // If we have an analysis ID but no data, we can resume
          updates.currentAnalysisId = savedAnalysisId;
        }
        
        if (savedCollections) {
          try {
            updates.testCollections = JSON.parse(savedCollections);
          } catch (e) {
            console.error('Error parsing saved collections:', e);
          }
        }
        
        if (Object.keys(updates).length > 0) {
          set(updates);
        }
        
        // Load test sessions from database if we have an analysis ID
        if (savedAnalysisId) {
          console.log('[Store] Loading test sessions for analysis:', savedAnalysisId);
          apiService.getTestSessionsByAnalysis(savedAnalysisId)
            .then((sessions: any) => {
              console.log('[Store] API response:', sessions);
              // Backend returns array directly, not wrapped in object
              if (Array.isArray(sessions) && sessions.length > 0) {
                console.log(`[Store] ✅ Loaded ${sessions.length} test sessions from database`, sessions);
                
                // Convert each session to a TestCollection with a single session
                const newCollections = sessions.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  description: `Test session from ${new Date(s.createdAt || s.created_at).toLocaleDateString()}`,
                  createdAt: s.createdAt || s.created_at,
                  updatedAt: s.createdAt || s.created_at,
                  testCases: s.testCases || [],  // Backend returns camelCase
                  testReport: s.testReport || s.test_report,
                  status: 'completed' as const,
                  sessionId: s.id,
                  metadata: {
                    totalTests: s.metadata?.totalTests || s.total_tests || 0,
                    passedTests: s.metadata?.passedTests || s.passed_tests || 0,
                    failedTests: s.metadata?.failedTests || s.failed_tests || 0,
                    successRate: s.metadata?.successRate || s.success_rate || 0,
                  },
                  testSessions: [{
                    id: s.id,
                    name: s.name,
                    color: s.color,
                    testCases: s.testCases || [],  // Backend returns camelCase
                    testReport: s.testReport || s.test_report,
                    createdAt: s.createdAt || s.created_at,
                    completedAt: s.completedAt || s.completed_at,
                    metadata: {
                      totalTests: s.metadata?.totalTests || s.total_tests || 0,
                      passedTests: s.metadata?.passedTests || s.passed_tests || 0,
                      failedTests: s.metadata?.failedTests || s.failed_tests || 0,
                      warningTests: s.metadata?.warningTests || s.warning_tests || 0,
                      successRate: s.metadata?.successRate || s.success_rate || 0,
                      totalFixes: s.metadata?.totalFixes || s.total_fixes || 0,
                      pendingFixes: s.metadata?.pendingFixes || s.pending_fixes || 0,
                      acceptedFixes: s.metadata?.acceptedFixes || s.accepted_fixes || 0,
                      rejectedFixes: s.metadata?.rejectedFixes || s.rejected_fixes || 0,
                    },
                    fixes: s.fixes || [],
                    fixesLocked: s.fixesLocked || s.fixes_locked || false,
                  }],
                  activeSessionIds: [s.id],
                }));
                
                console.log('[Store] Mapped collections:', newCollections);
                console.log('[Store] First collection testReport:', newCollections[0]?.testReport);
                console.log('[Store] First session testReport:', newCollections[0]?.testSessions?.[0]?.testReport);
                
                // Replace existing collections with database ones
                set({ testCollections: newCollections });
                
                // Set the first collection as active and make its first session visible
                if (newCollections.length > 0) {
                  const firstCollection = newCollections[0];
                  const firstSessionId = firstCollection.testSessions?.[0]?.id;
                  
                  if (!get().activeCollectionId) {
                    set({ 
                      activeCollectionId: firstCollection.id,
                      visibleSessionIds: firstSessionId ? [firstSessionId] : []
                    });
                    console.log('[Store] Set active collection:', firstCollection.id);
                    console.log('[Store] Set visible session:', firstSessionId);
                  }
                }
                
                console.log('[Store] Updated testCollections:', get().testCollections);
                console.log('[Store] visibleSessionIds:', get().visibleSessionIds);
              } else {
                console.log('[Store] No test sessions found or invalid response');
              }
            })
            .catch((error: any) => {
              console.error('[Store] ❌ Error loading test sessions from database:', error);
            });
        } else {
          console.log('[Store] No analysis ID found, skipping test session load');
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
      errorHighlightedElements: new Set(),
      warningHighlightedElements: new Set(),
      isTestingInProgress: false,
      currentTestIndex: -1,
    });
  },
  
  // Fix Management Actions
  acceptFix: (fixId, sessionId) => set((state) => {
    const collection = state.testCollections.find(c => 
      c.testSessions?.some(s => s.id === sessionId)
    );
    if (!collection) return state;
    
    const updatedCollections = state.testCollections.map(c => {
      if (c.id !== collection.id) return c;
      
      return {
        ...c,
        testSessions: c.testSessions?.map(s => {
          if (s.id !== sessionId) return s;
          
          return {
            ...s,
            fixes: s.fixes.map((f: any) => 
              f.id === fixId 
                ? { ...f, status: 'accepted', decidedAt: new Date().toISOString() }
                : f
            ),
            metadata: {
              ...s.metadata,
              pendingFixes: s.metadata.pendingFixes - 1,
              acceptedFixes: s.metadata.acceptedFixes + 1,
            }
          };
        })
      };
    });
    
    return { testCollections: updatedCollections };
  }),
  
  rejectFix: (fixId, sessionId) => set((state) => {
    const collection = state.testCollections.find(c => 
      c.testSessions?.some(s => s.id === sessionId)
    );
    if (!collection) return state;
    
    const updatedCollections = state.testCollections.map(c => {
      if (c.id !== collection.id) return c;
      
      return {
        ...c,
        testSessions: c.testSessions?.map(s => {
          if (s.id !== sessionId) return s;
          
          return {
            ...s,
            fixes: s.fixes.map((f: any) => 
              f.id === fixId 
                ? { ...f, status: 'rejected', decidedAt: new Date().toISOString() }
                : f
            ),
            metadata: {
              ...s.metadata,
              pendingFixes: s.metadata.pendingFixes - 1,
              rejectedFixes: s.metadata.rejectedFixes + 1,
            }
          };
        })
      };
    });
    
    return { testCollections: updatedCollections };
  }),
  
  queueFixApplication: (fix) => set((state) => ({
    queuedChanges: [
      ...state.queuedChanges,
      {
        id: `fix-${Date.now()}`,
        type: 'fix' as const,
        description: `Apply fix: ${fix.issue}`,
        data: fix,
        timestamp: Date.now(),
      }
    ]
  })),
  
  hasPendingFixes: () => {
    const { testCollections } = get();
    return testCollections.some((c: TestCollection) => 
      c.testSessions?.some((s: any) => 
        s.metadata.pendingFixes > 0
      )
    );
  },
  
  canExportReport: () => {
    const { testCollections } = get();
    // Can only export if no pending fixes exist
    return !testCollections.some((c: TestCollection) => 
      c.testSessions?.some((s: any) => s.metadata.pendingFixes > 0)
    );
  },
  
  // Multi-Session Actions
  addTestSession: (session) => set((state) => {
    const activeCollection = state.testCollections.find(c => c.id === state.activeCollectionId);
    if (!activeCollection) return state;
    
    const updatedCollections = state.testCollections.map(c => {
      if (c.id !== activeCollection.id) return c;
      
      return {
        ...c,
        testSessions: [...(c.testSessions || []), session],
        activeSessionIds: [...(c.activeSessionIds || []), session.id],
      };
    });
    
    return { 
      testCollections: updatedCollections,
      visibleSessionIds: [...state.visibleSessionIds, session.id]
    };
  }),
  
  toggleSessionVisibility: (sessionId) => set((state) => {
    const isVisible = state.visibleSessionIds.includes(sessionId);
    return {
      visibleSessionIds: isVisible
        ? state.visibleSessionIds.filter(id => id !== sessionId)
        : [...state.visibleSessionIds, sessionId]
    };
  }),
  
  getVisibleSessions: () => {
    const state = get();
    return state.visibleSessionIds;
  },
}));
