'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { Canvas } from './Canvas';
import { StatusPanel } from './StatusPanel';
import { DetailsPanel } from './DetailsPanel';
import TestingPanel from './TestingPanel';
import TestReportPanel from './TestReportPanel';
import { Loader2, Database, Trash2, Activity, Beaker } from 'lucide-react';

export function Dashboard() {
  const [githubUrl, setGithubUrl] = useState('');
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
    loadFromLocalStorage,
    reset,
    setPanelView,
  } = useStore();

  // Load from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage();
    
    // Check if there's an ongoing analysis
    const savedAnalysisId = localStorage.getItem('currentAnalysisId');
    const savedGithubUrl = localStorage.getItem('currentGithubUrl');
    
    if (savedAnalysisId && savedGithubUrl && !agentData) {
      // Resume polling for the saved analysis
      setGithubUrl(savedGithubUrl);
      setLoading(true, '🔄 Resuming analysis...');
      
      addStatusMessage({
        type: 'info',
        message: '🔄 Resuming previous analysis...',
      });
      
      // Start polling immediately
      resumeAnalysis(savedAnalysisId, savedGithubUrl);
    }
  }, [loadFromLocalStorage]);

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
      
      // Clear analysis ID from localStorage
      localStorage.removeItem('currentAnalysisId');
      localStorage.removeItem('currentGithubUrl');
      
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

  const resumeAnalysis = async (analysisId: string, githubUrl: string) => {
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
          
          // Clear analysis ID from localStorage on success
          localStorage.removeItem('currentAnalysisId');
          localStorage.removeItem('currentGithubUrl');
          
          setAgentData(statusData.data, githubUrl, statusData.from_cache);
          
          const cacheMsg = statusData.from_cache ? ' (from cache)' : '';
          addStatusMessage({
            type: 'success',
            message: `🎉 Analysis complete${cacheMsg}! Found ${statusData.data.agents.length} agents, ${statusData.data.tools.length} tools, and ${statusData.data.relationships.length} relationships.`,
          });
          
          setLoading(false);
        } else if (statusData.status === 'error') {
          clearInterval(pollInterval);
          
          // Clear analysis ID from localStorage on error
          localStorage.removeItem('currentAnalysisId');
          localStorage.removeItem('currentGithubUrl');
          
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUrl.trim()) {
      addStatusMessage({
        type: 'error',
        message: 'Please enter a GitHub URL',
      });
      return;
    }

    try {
      setLoading(true, '🚀 Starting analysis...');
      setAnalysisSteps([]);
      
      addStatusMessage({
        type: 'info',
        message: `🚀 Starting analysis of ${githubUrl}`,
      });

      // Start the analysis (non-blocking)
      const analysisId = await apiService.startAnalysis(githubUrl);
      
      // Save analysis ID to localStorage for resume capability
      localStorage.setItem('currentAnalysisId', analysisId);
      localStorage.setItem('currentGithubUrl', githubUrl);
      
      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await apiService.getAnalysisStatus(analysisId);
          
          const stepEmojis: { [key: string]: string } = {
            'Loading from cache': '💾',
            'Fetching repository': '�',
            'Scanning files': '�',
            'Identifying agents': '🤖',
            'Extracting tools': '🔧',
            'Mapping relationships': '🔗',
            'Complete': '✅'
          };
          
          const emoji = stepEmojis[statusData.progress.name] || '⚡';
          
          // Update loading message
          setLoading(true, `${emoji} ${statusData.progress.name}...`);
          
          // Update steps array (use functional update)
          setAnalysisSteps((prev: any[]) => {
            const existingIndex = prev.findIndex((s: any) => s.step === statusData.progress.step);
            if (existingIndex >= 0) {
              // Update existing step
              const newSteps = [...prev];
              newSteps[existingIndex] = statusData.progress;
              return newSteps;
            } else {
              // Add new step
              return [...prev, statusData.progress];
            }
          });
          
          // Add status message for step changes
          if (statusData.progress.status === 'in_progress') {
            addStatusMessage({
              type: 'progress',
              message: `${emoji} ${statusData.progress.message}`,
            });
          }
          
          // Check if completed
          if (statusData.status === 'success' && statusData.data) {
            clearInterval(pollInterval);
            
            // Clear analysis ID from localStorage on success
            localStorage.removeItem('currentAnalysisId');
            localStorage.removeItem('currentGithubUrl');
            
            setAgentData(statusData.data, githubUrl, statusData.from_cache);
            
            const cacheMsg = statusData.from_cache ? ' (from cache)' : '';
            addStatusMessage({
              type: 'success',
              message: `🎉 Analysis complete${cacheMsg}! Found ${statusData.data.agents.length} agents, ${statusData.data.tools.length} tools, and ${statusData.data.relationships.length} relationships.`,
            });
            
            setLoading(false);
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            
            // Clear analysis ID from localStorage on error
            localStorage.removeItem('currentAnalysisId');
            localStorage.removeItem('currentGithubUrl');
            
            addStatusMessage({
              type: 'error',
              message: `❌ Analysis failed: ${statusData.progress.message}`,
            });
            
            setLoading(false);
          }
        } catch (pollError: any) {
          clearInterval(pollInterval);
          
          // Don't clear localStorage on poll error - might be temporary network issue
          
          addStatusMessage({
            type: 'error',
            message: `❌ Error checking status: ${pollError.message}`,
          });
          setLoading(false);
        }
      }, 500);
      
    } catch (error: any) {
      // Clear localStorage on initial error
      localStorage.removeItem('currentAnalysisId');
      localStorage.removeItem('currentGithubUrl');
      
      addStatusMessage({
        type: 'error',
        message: `❌ Failed to start analysis: ${error.message}`,
      });
      setLoading(false);
    }
  };

  return (
    <div className="h-screen pt-16 flex">
      {/* Main Canvas Area - 3:4 ratio */}
      <div className="flex-3 relative bg-muted/30">
        {!agentData && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md w-full px-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Start Your Analysis
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="github-url" className="block text-sm font-medium mb-2">
                    GitHub Repository URL
                  </label>
                  <input
                    id="github-url"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>
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
    </div>
  );
}
