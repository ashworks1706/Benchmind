'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { Canvas } from './Canvas';
import { StatusPanel } from './StatusPanel';
import { DetailsPanel } from './DetailsPanel';
import { LoaderCircle } from 'lucide-react';

export function Dashboard() {
  const [githubUrl, setGithubUrl] = useState('');
  const { agentData, isLoading, setAgentData, setLoading, addStatusMessage, panelView } = useStore();

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
      setLoading(true, 'Analyzing repository...');
      addStatusMessage({
        type: 'info',
        message: `Starting analysis of ${githubUrl}`,
      });

      const data = await apiService.analyzeRepository(githubUrl);
      
      setAgentData(data);
      addStatusMessage({
        type: 'success',
        message: `Successfully analyzed repository. Found ${data.agents.length} agents and ${data.tools.length} tools.`,
      });
      
      setLoading(false);
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to analyze repository: ${error.message}`,
      });
      setLoading(false);
    }
  };

  return (
    <div className="h-screen pt-16 flex">
      {/* Main Canvas Area - 3:4 ratio */}
      <div className="flex-[3] relative bg-muted/30">
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
                      <LoaderCircle className="w-4 h-4 animate-spin" />
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
          <Canvas />
        )}
      </div>

      {/* Right Panel - 1:4 ratio */}
      <div className="flex-1 border-l border-border bg-background overflow-hidden flex flex-col">
        {panelView === 'both' && (
          <>
            <div className="flex-1 overflow-hidden">
              <DetailsPanel />
            </div>
            <div className="flex-1 border-t border-border overflow-hidden">
              <StatusPanel />
            </div>
          </>
        )}
        {panelView === 'status' && <StatusPanel />}
        {panelView === 'details' && <DetailsPanel />}
      </div>
    </div>
  );
}
