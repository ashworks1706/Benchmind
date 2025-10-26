'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { projectService } from '@/lib/projects';
import { Canvas } from '@/components/Canvas';
import { StatusPanel } from '@/components/StatusPanel';
import { DetailsPanel } from '@/components/DetailsPanel';
import TestingPanel from '@/components/TestingPanel';
import TestReportPanel from '@/components/TestReportPanel';
import ChangeQueuePanel from '@/components/ChangeQueuePanel';
import { Loader2, Database, Trash2, Activity, Beaker, ArrowLeft } from 'lucide-react';
import { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [rightPanelView, setRightPanelView] = useState<'status' | 'testing' | 'report'>('status');
  
  const { 
    agentData, 
    isLoading, 
    setAgentData, 
    setLoading, 
    addStatusMessage, 
    panelView,
    setAnalysisSteps,
    selectedElement,
    currentRepoUrl,
    fromCache,
    reset,
    setCurrentAnalysisId,
    setTestCases,
    loadFromLocalStorage,
  } = useStore();

  useEffect(() => {
    console.log('[ProjectDetailPage] Initializing store from localStorage');
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setProjectLoading(true);
        const projectData = await projectService.getProject(projectId);
        setProject(projectData);
        
        // Check if there's an ongoing analysis for this project
        const analysisId = (projectData.config as any)?.analysisId;
        if (analysisId && !agentData) {
          setCurrentAnalysisId(analysisId);
          loadFromLocalStorage();
          // Resume polling for the saved analysis
          setLoading(true, '🔄 Resuming analysis...');
          addStatusMessage({
            type: 'info',
            message: '🔄 Resuming previous analysis...',
          });
          resumeAnalysis(analysisId, projectData.repoUrl);
        }
      } catch (error: any) {
        addStatusMessage({
          type: 'error',
          message: `Failed to load project: ${error.message}`,
        });
      } finally {
        setProjectLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Watch for panelView changes from store (e.g., from TestingPanel)
  useEffect(() => {
    if (panelView === 'testing') {
      setRightPanelView('testing');
    } else if (panelView === 'testing-report') {
      setRightPanelView('report');
    }
  }, [panelView]);

  const handleClearCache = async () => {
    try {
      if (currentRepoUrl) {
        await apiService.invalidateCache(currentRepoUrl);
      }
      
      // Clear analysis ID from project
      if (project) {
        await projectService.updateProject(projectId, {
          config: { ...project.config, analysisId: undefined } as any
        });
      }
      
      reset();
      addStatusMessage({
        type: 'success',
        message: '🗑️ Cache cleared successfully',
      });
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to clear cache: ${error.message}`,
      });
    }
  };

  const resumeAnalysis = async (analysisId: string, repoUrl: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusData = await apiService.getAnalysisStatus(analysisId);
        
        const stepEmojis: { [key: string]: string } = {
          'Loading from cache': '💾',
          'Fetching repository': '📥',
          'Scanning files': '📄',
          'Identifying agents': '🤖',
          'Extracting tools': '🔧',
          'Mapping relationships': '🔗',
          'Complete': '✅'
        };
        
        const emoji = stepEmojis[statusData.progress.name] || '⚙️';
        
        setAnalysisSteps((prev) => {
          const existingIndex = prev.findIndex(s => s.step === statusData.progress.step);
          if (existingIndex >= 0) {
            const newSteps = [...prev];
            newSteps[existingIndex] = statusData.progress;
            return newSteps;
          } else {
            return [...prev, statusData.progress];
          }
        });
        
        if (statusData.progress.status === 'in_progress') {
          addStatusMessage({
            type: 'progress',
            message: `${emoji} ${statusData.progress.message}`,
          });
        }
        
        if (statusData.status === 'success' && statusData.data) {
          clearInterval(pollInterval);
          setAgentData(statusData.data, repoUrl, statusData.from_cache);
          setCurrentAnalysisId(analysisId); // Save analysis ID to store
          
          // Load test cases if they exist
          if (statusData.test_cases && statusData.test_cases.length > 0) {
            setTestCases(statusData.test_cases);
            addStatusMessage({
              type: 'success',
              message: `📋 Loaded ${statusData.test_cases.length} existing test cases`,
            });
          }
          
          const cacheMsg = statusData.from_cache ? ' (from cache)' : '';
          addStatusMessage({
            type: 'success',
            message: `🎉 Analysis complete${cacheMsg}! Found ${statusData.data.agents.length} agents, ${statusData.data.tools.length} tools, and ${statusData.data.relationships.length} relationships.`,
          });
          
          setLoading(false);
        } else if (statusData.status === 'error') {
          clearInterval(pollInterval);
          addStatusMessage({
            type: 'error',
            message: `❌ Analysis failed: ${statusData.progress.message}`,
          });
          setLoading(false);
        }
      } catch (pollError: any) {
        clearInterval(pollInterval);
        addStatusMessage({
          type: 'error',
          message: `❌ Error checking status: ${pollError.message}`,
        });
        setLoading(false);
      }
    }, 500);
  };

  const handleStartAnalysis = async () => {
    if (!project) return;

    try {
      setLoading(true, '🚀 Starting analysis...');
      setAnalysisSteps([]);
      
      addStatusMessage({
        type: 'info',
        message: `🚀 Starting analysis of ${project.repoUrl}`,
      });

      const analysisId = await apiService.startAnalysis(project.repoUrl, projectId);
      
      // Save analysis ID to project
      await projectService.updateProject(projectId, {
        config: { ...project.config, analysisId } as any
      });
      
      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await apiService.getAnalysisStatus(analysisId);
          
          const stepEmojis: { [key: string]: string } = {
            'Loading from cache': '💾',
            'Fetching repository': '📥',
            'Scanning files': '📄',
            'Identifying agents': '🤖',
            'Extracting tools': '🔧',
            'Mapping relationships': '🔗',
            'Complete': '✅'
          };
          
          const emoji = stepEmojis[statusData.progress.name] || '⚡';
          
          setLoading(true, `${emoji} ${statusData.progress.name}...`);
          
          setAnalysisSteps((prev: any[]) => {
            const existingIndex = prev.findIndex((s: any) => s.step === statusData.progress.step);
            if (existingIndex >= 0) {
              const newSteps = [...prev];
              newSteps[existingIndex] = statusData.progress;
              return newSteps;
            } else {
              return [...prev, statusData.progress];
            }
          });
          
          if (statusData.progress.status === 'in_progress') {
            addStatusMessage({
              type: 'progress',
              message: `${emoji} ${statusData.progress.message}`,
            });
          }
          
          if (statusData.status === 'success' && statusData.data) {
            clearInterval(pollInterval);
            setAgentData(statusData.data, project.repoUrl, statusData.from_cache);
            setCurrentAnalysisId(analysisId); // Save analysis ID to store
            
            // Load test cases if they exist
            if (statusData.test_cases && statusData.test_cases.length > 0) {
              setTestCases(statusData.test_cases);
              addStatusMessage({
                type: 'success',
                message: `📋 Loaded ${statusData.test_cases.length} existing test cases`,
              });
            }
            
            const cacheMsg = statusData.from_cache ? ' (from cache)' : '';
            addStatusMessage({
              type: 'success',
              message: `🎉 Analysis complete${cacheMsg}! Found ${statusData.data.agents.length} agents, ${statusData.data.tools.length} tools, and ${statusData.data.relationships.length} relationships.`,
            });
            
            setLoading(false);
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            addStatusMessage({
              type: 'error',
              message: `❌ Analysis failed: ${statusData.progress.message}`,
            });
            setLoading(false);
          }
        } catch (pollError: any) {
          clearInterval(pollInterval);
          addStatusMessage({
            type: 'error',
            message: `❌ Error checking status: ${pollError.message}`,
          });
          setLoading(false);
        }
      }, 500);
      
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `❌ Failed to start analysis: ${error.message}`,
      });
      setLoading(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="h-screen pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
          <div className="text-xl font-semibold">Loading project...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl font-semibold text-destructive">Project not found</div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen pt-16 flex">
      {/* Main Canvas Area - 3:4 ratio */}
      <div className="flex-3 relative bg-muted/30">
        {!agentData && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md w-full px-8">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <h2 className="text-2xl font-bold mb-2">
                {project.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {project.repoUrl}
              </p>
              
              <button
                onClick={handleStartAnalysis}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <Canvas />
            
            {/* Cache status badge */}
            {agentData && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {fromCache && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-md text-green-600 dark:text-green-400 text-sm">
                    <Database className="w-4 h-4" />
                    <span>Cached</span>
                  </div>
                )}
                <button
                  onClick={handleClearCache}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-600 dark:text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  title="Clear cache and reset"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Details Panel Overlay - appears on top of canvas when item is selected */}
        {selectedElement && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
            <div className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <DetailsPanel />
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Status or Testing */}
      <div className="flex-1 border-l border-border bg-background overflow-hidden flex flex-col">
        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-muted/50">
          <button
            onClick={() => setRightPanelView('status')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              rightPanelView === 'status'
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Status & Progress
          </button>
          <button
            onClick={() => setRightPanelView('testing')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              rightPanelView === 'testing'
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            disabled={!agentData}
          >
            <Beaker className="w-4 h-4" />
            Testing Suite
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {rightPanelView === 'status' && <StatusPanel />}
          {rightPanelView === 'testing' && <TestingPanel />}
          {rightPanelView === 'report' && <TestReportPanel />}
        </div>
      </div>
      
      {/* Change Queue Panel - Bottom Left */}
      <ChangeQueuePanel />
    </div>
  );
}
