'use client';

import { useStore } from '@/lib/store';
import { ScrollArea } from './ui/ScrollArea';
import { ProgressSteps } from './ProgressSteps';
import { ChevronDown, ChevronUp, Play, StopCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useState } from 'react';

export function StatusPanel() {
  const {
    statusMessages,
    testCases,
    testResults,
    isTestingInProgress,
    currentTestIndex,
    agentData,
    isLoading,
    analysisSteps,
    startTesting,
    stopTesting,
    setCurrentTestIndex,
    addTestResult,
    addStatusMessage,
    highlightElements,
    clearHighlights,
    setTestCases,
  } = useStore();

  const handleStartTesting = async () => {
    if (!agentData) return;

    try {
      // Generate test cases if not already generated
      if (testCases.length === 0) {
        addStatusMessage({
          type: 'info',
          message: 'Generating test cases...',
        });

        const cases = await apiService.generateTests(agentData);
        setTestCases(cases);

        addStatusMessage({
          type: 'success',
          message: `Generated ${cases.length} test cases`,
        });
      }

      startTesting();

      // Run tests sequentially
      for (let i = 0; i < testCases.length; i++) {
        setCurrentTestIndex(i);
        const testCase = testCases[i];

        addStatusMessage({
          type: 'info',
          message: `Running test ${i + 1}/${testCases.length}: ${testCase.name}`,
        });

        // Highlight elements being tested
        highlightElements(testCase.highlight_elements);

        // Run the test
        const result = await apiService.runTest(testCase, agentData);
        addTestResult(result);

        addStatusMessage({
          type: result.status === 'passed' ? 'success' : 'error',
          message: `Test ${i + 1} ${result.status}: ${result.results.summary}`,
        });

        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      clearHighlights();
      stopTesting();

      addStatusMessage({
        type: 'success',
        message: 'All tests completed!',
      });
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Testing failed: ${error.message}`,
      });
      stopTesting();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Status</h3>
        {agentData && (
          <button
            onClick={isTestingInProgress ? stopTesting : handleStartTesting}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${
              isTestingInProgress
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            disabled={isTestingInProgress && currentTestIndex === -1}
          >
            {isTestingInProgress ? (
              <>
                <StopCircle className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Testing
              </>
            )}
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Show analysis progress if in progress */}
        {isLoading && analysisSteps.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysis Progress
            </h4>
            <ProgressSteps steps={analysisSteps} />
          </div>
        )}
        
        <div className="space-y-3">
          {statusMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Submit a GitHub repository to get started.
            </p>
          ) : (
            statusMessages.map((msg) => (
              <StatusMessage key={msg.id} message={msg} />
            ))
          )}
        </div>

        {testResults.size > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold mb-4">Test Results Summary</h4>
            <div className="space-y-2">
              {Array.from(testResults.values()).map((result) => (
                <TestResultCard key={result.test_id} result={result} />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function StatusMessage({ message }: { message: any }) {
  const typeColors = {
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500',
    success: 'bg-green-500/10 text-green-700 dark:text-green-300 border-l-4 border-green-500',
    error: 'bg-red-500/10 text-red-700 dark:text-red-300 border-l-4 border-red-500',
    progress: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-l-4 border-purple-500',
  };

  const typeIcons = {
    info: '💡',
    success: '✓',
    error: '✗',
    progress: '⟳',
  };

  return (
    <div
      className={`p-3 rounded-md text-sm animate-in slide-in-from-right-5 ${typeColors[message.type as keyof typeof typeColors]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-base">{typeIcons[message.type as keyof typeof typeIcons]}</span>
          <p className="flex-1 leading-relaxed">{message.message}</p>
        </div>
        <span className="text-xs opacity-70 whitespace-nowrap">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function TestResultCard({ result }: { result: any }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    passed: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300',
    failed: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    error: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300',
  };

  return (
    <div className={`border rounded-md p-3 ${statusColors[result.status as keyof typeof statusColors]}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-medium"
      >
        <span>{result.results.summary}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 text-sm">
          <p>{result.results.details}</p>
          {result.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="font-medium mb-1">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                {result.recommendations.map((rec: any, i: number) => (
                  <li key={i}>{rec.issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
