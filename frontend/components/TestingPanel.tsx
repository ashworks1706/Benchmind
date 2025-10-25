'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TestCase } from '@/types';
import { 
  Play, 
  Square, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Edit3,
  Send,
  BarChart3
} from 'lucide-react';

  export default function TestingPanel() {
  const {
    agentData,
    testingSessionId,
    testingStatus,
    testingProgress,
    pendingTestCases,
    testReport,
    currentRepoUrl,
    setTestingSessionId,
    setTestingStatus,
    addTestingProgress,
    clearTestingProgress,
    setTestReport,
    setPendingTestCases,
    addStatusMessage,
    setPanelView,
    highlightElements,
    clearHighlights,
    highlightErrorElements,
    clearErrorHighlights,
  } = useStore();

  const [isPolling, setIsPolling] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [isUpdatingTests, setIsUpdatingTests] = useState(false);

  // Start test generation
  const handleStartTesting = async () => {
    if (!agentData) return;

    try {
      clearTestingProgress();
      addStatusMessage({
        type: 'info',
        message: '🧪 Starting test generation...',
      });

      const response = await apiService.startTestingSession(agentData, currentRepoUrl || undefined);
      setTestingSessionId(response.session_id);
      
      if (response.from_cache) {
        setTestingStatus('ready_for_confirmation');
        addStatusMessage({
          type: 'success',
          message: '⚡ Test cases loaded from cache! Ready to run.',
        });
        setIsPolling(true); // Still poll to get the cached test cases
      } else {
        setTestingStatus('generating');
        setIsPolling(true);
        addStatusMessage({
          type: 'success',
          message: 'Test generation session started!',
        });
      }
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to start testing: ${error.message}`,
      });
    }
  };

  // Poll for progress updates
  const pollProgress = useCallback(async () => {
    if (!testingSessionId || !isPolling) return;

    try {
      const data = await apiService.getTestingProgress(testingSessionId);
      
      setTestingStatus(data.status as any);
      
      // Process ALL progress messages from backend
      if (data.progress && data.progress.length > testingProgress.length) {
        // Add only new progress messages
        const newMessages = data.progress.slice(testingProgress.length);
        newMessages.forEach(progress => {
          addTestingProgress(progress);
          
          // Add to status messages
          if (progress.data?.message) {
            addStatusMessage({
              type: progress.type === 'error' ? 'error' : 'info',
              message: progress.data.message,
            });
          }

          // Handle highlighting - extract element IDs
          if (progress.data?.highlight_elements && progress.data.highlight_elements.length > 0) {
            highlightElements(progress.data.highlight_elements);
            
            // Auto-clear highlights after 3 seconds unless it's a new test starting
            if (progress.type !== 'test_started') {
              setTimeout(() => {
                clearHighlights();
              }, 3000);
            }
          }
          
          // Handle test case generation - update pending list incrementally
          if (progress.type === 'test_case_generated' && progress.data?.test_case) {
            setPendingTestCases(prev => {
              // Check if this test case already exists
              const exists = prev.some(tc => tc.id === progress.data.test_case.id);
              if (exists) return prev;
              return [...prev, progress.data.test_case];
            });
          }
        });
      }

      // Store final test cases when ready
      if (data.test_cases && data.test_cases.length > 0 && data.status === 'ready_for_confirmation') {
        setPendingTestCases(data.test_cases);
      }

      // Stop polling when ready for confirmation or completed
      if (data.status === 'ready_for_confirmation' || data.status === 'completed') {
        setIsPolling(false);
        
        if (data.status === 'completed') {
          // Clear all highlights when testing completes
          clearHighlights();
          
          // Fetch final report
          const reportData = await apiService.getTestReport(testingSessionId);
          setTestReport(reportData.report);
          
          // Highlight failed/warning tests in canvas for visualization
          if (reportData.report) {
            const failedTestIds: string[] = [];
            
            // Collect highlight elements from failed/warning tests
            if (reportData.report.test_results) {
              reportData.report.test_results.forEach((result: any) => {
                if (result.status === 'failed' || result.status === 'warning') {
                  // Find the corresponding test case to get highlight_elements
                  const testCase = data.test_cases?.find((tc: any) => tc.id === result.test_id);
                  if (testCase?.highlight_elements) {
                    failedTestIds.push(...testCase.highlight_elements);
                  }
                }
              });
            }
            
            // Highlight failed/warning elements with error styling
            if (failedTestIds.length > 0) {
              setTimeout(() => {
                highlightErrorElements(failedTestIds);
              }, 500); // Small delay after clearing
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error polling progress:', error);
    }
  }, [testingSessionId, isPolling, testingProgress.length, addTestingProgress, addStatusMessage, highlightElements, clearHighlights, setPendingTestCases, setTestingStatus, setTestReport]);

  // Poll every 2 seconds when active
  useEffect(() => {
    if (isPolling && testingSessionId) {
      const interval = setInterval(pollProgress, 2000);
      return () => clearInterval(interval);
    }
  }, [isPolling, testingSessionId, pollProgress]);

  // Update test cases based on user feedback
  const handleUpdateTests = async () => {
    if (!testingSessionId || !userFeedback.trim()) return;

    try {
      setIsUpdatingTests(true);
      clearTestingProgress();
      
      addStatusMessage({
        type: 'info',
        message: '🔄 Updating test cases based on your feedback...',
      });

      const { test_cases } = await apiService.updateTestCases(testingSessionId, userFeedback);
      setPendingTestCases(test_cases);
      setUserFeedback('');

      addStatusMessage({
        type: 'success',
        message: `✨ Updated test suite with ${test_cases.length} test cases!`,
      });
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to update tests: ${error.message}`,
      });
    } finally {
      setIsUpdatingTests(false);
    }
  };

  // Confirm and start test execution
  const handleConfirmTests = async () => {
    if (!testingSessionId) return;

    try {
      clearTestingProgress();
      clearHighlights();
      
      addStatusMessage({
        type: 'info',
        message: '🚀 Starting test execution...',
      });

      await apiService.confirmTests(testingSessionId);
      setTestingStatus('running_tests');
      setIsPolling(true);

      addStatusMessage({
        type: 'success',
        message: 'Test execution started! Watch the canvas for highlights.',
      });
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to start tests: ${error.message}`,
      });
    }
  };

  // View test report
  const handleViewReport = () => {
    setPanelView('testing-report');
  };

  // Render test case card
  const renderTestCase = (testCase: TestCase, index: number) => {
    const categoryColors: Record<string, string> = {
      tool_calling: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      reasoning: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      collaborative: 'bg-green-500/20 text-green-700 dark:text-green-300',
      connection: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      performance: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
      error_handling: 'bg-red-500/20 text-red-700 dark:text-red-300',
      output_quality: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      security: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
    };

    const categoryColor = categoryColors[testCase.category] || 'bg-gray-500/20 text-gray-700 dark:text-gray-300';

    return (
      <div
        key={testCase.id}
        className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{testCase.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${categoryColor}`}>
              {testCase.category.replace('_', ' ')}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
        </div>

        <p className="text-xs text-muted-foreground mb-3">{testCase.description}</p>

        {testCase.metrics && testCase.metrics.length > 0 && (
          <div className="space-y-1 mb-3">
            {testCase.metrics.map((metric: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{metric.name}</span>
                <span className="font-medium">
                  Benchmark: {metric.benchmark}{metric.unit}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium">{testCase.target?.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-bold flex items-center gap-2">
          🧪 Testing Suite
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and run comprehensive tests for your AI agents
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Start Testing */}
          {testingStatus === 'idle' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ready to Test Your Agents?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate comprehensive test cases covering tool calling, reasoning, collaboration, and more.
                </p>
                <Button onClick={handleStartTesting} disabled={!agentData}>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Test Cases
                </Button>
              </div>
            </div>
          )}

          {/* Generating Tests */}
          {testingStatus === 'generating' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Generating Test Cases...</p>
                  <p className="text-sm text-muted-foreground">
                    Analyzing your codebase and creating targeted tests
                  </p>
                </div>
              </div>

              {/* Show generated test cases as they appear */}
              {pendingTestCases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Generated Test Cases:</h4>
                  {pendingTestCases.map((tc, idx) => renderTestCase(tc, idx))}
                </div>
              )}
            </div>
          )}

          {/* Ready for Confirmation */}
          {testingStatus === 'ready_for_confirmation' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold">Test Cases Ready!</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generated {pendingTestCases.length} test cases. Review them below and request changes if needed.
                </p>
              </div>

              {/* Test Cases List */}
              <div className="space-y-3">
                {pendingTestCases.map((tc, idx) => renderTestCase(tc, idx))}
              </div>

              {/* Feedback Input */}
              <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
                <label className="text-sm font-medium">Request Modifications</label>
                <textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="e.g., Add more security tests, focus on the authentication agent, increase benchmarks..."
                  className="w-full p-3 rounded-md border border-input bg-background text-sm min-h-20 resize-none"
                  disabled={isUpdatingTests}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateTests}
                    disabled={!userFeedback.trim() || isUpdatingTests}
                    variant="outline"
                    size="sm"
                  >
                    {isUpdatingTests ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update Tests
                      </>
                    )}
                  </Button>
                  <Button onClick={handleConfirmTests} size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Confirm & Run Tests
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Running Tests */}
          {testingStatus === 'running_tests' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium">Running Tests...</p>
                  <p className="text-sm text-muted-foreground">
                    Watch the canvas for highlighted agents and connections
                  </p>
                </div>
              </div>

              {/* Progress Log */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Test Progress:</h4>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {testingProgress.map((progress, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-muted/50 rounded text-xs font-mono"
                    >
                      {progress.data?.message || 'Running...'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Completed */}
          {testingStatus === 'completed' && testReport && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold">Testing Complete!</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  All tests have been executed. View the detailed report for insights and recommendations.
                </p>

                {/* Quick Summary */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Tests</p>
                    <p className="text-2xl font-bold">{testReport.summary?.total_tests || 0}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {testReport.summary?.success_rate || 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">Passed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {testReport.summary?.passed || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {testReport.summary?.failed || 0}
                    </p>
                  </div>
                </div>

                <Button onClick={handleViewReport} className="w-full mt-4">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
