'use client';

import { useStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Zap,
  Shield,
  Brain,
  Link,
  Wrench
} from 'lucide-react';
import { useState } from 'react';
import { apiService } from '@/lib/api';
import { Fix } from '@/types';

export default function TestReportPanel() {
  const { testReport, setPanelView, addStatusMessage, agentData } = useStore();
  const [applyingFix, setApplyingFix] = useState<string | null>(null);

  const handleBackToTests = () => {
    setPanelView('testing');
  };

  if (!testReport) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No test report available</p>
      </div>
    );
  }

  const handleApplyFix = async (recommendation: any) => {
    if (!agentData) return;

    try {
      setApplyingFix(recommendation.fix.file_path);
      
      addStatusMessage({
        type: 'info',
        message: `🔧 Applying fix to ${recommendation.fix.file_path}...`,
      });

      await apiService.applyFix(recommendation, agentData);

      addStatusMessage({
        type: 'success',
        message: `✅ Fix applied successfully to ${recommendation.fix.file_path}`,
      });
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `❌ Failed to apply fix: ${error.message}`,
      });
    } finally {
      setApplyingFix(null);
    }
  };

  const categoryIcons: Record<string, any> = {
    tool_calling: Wrench,
    reasoning: Brain,
    collaborative: Link,
    connection: Link,
    performance: Zap,
    security: Shield,
  };

  const severityColors = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
    high: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
    low: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToTests}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Test Report
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive analysis of your AI agent system performance
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Total Tests</p>
              <p className="text-3xl font-bold">{testReport.summary.total_tests}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {testReport.summary.success_rate}%
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Passed</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-3xl font-bold">{testReport.summary.passed}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Failed</p>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-3xl font-bold">{testReport.summary.failed}</p>
              </div>
            </div>
          </div>

          {/* Detailed Test Results */}
          {testReport.test_results && testReport.test_results.length > 0 && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Detailed Test Results ({testReport.test_results.length})
              </h4>
              <div className="space-y-3">
                {testReport.test_results.map((result: any, idx: number) => {
                  const statusColor = result.status === 'passed' 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : result.status === 'warning'
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-red-500/30 bg-red-500/5';
                  
                  const StatusIcon = result.status === 'passed' 
                    ? CheckCircle2 
                    : result.status === 'warning'
                    ? AlertTriangle
                    : XCircle;

                  return (
                    <details key={idx} className={`p-3 rounded-lg border ${statusColor}`}>
                      <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <span>{result.results?.summary || result.test_id}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-background/50 uppercase font-semibold">
                          {result.status}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-2 text-xs">
                        {result.results?.details && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Details:</p>
                            <p className="text-foreground">{result.results.details}</p>
                          </div>
                        )}
                        
                        {result.results?.logs && result.results.logs.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Execution Logs:</p>
                            <div className="bg-background/50 rounded p-2 font-mono space-y-1">
                              {result.results.logs.map((log: string, logIdx: number) => (
                                <div key={logIdx} className="text-muted-foreground">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.metrics && result.metrics.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Metrics:</p>
                            <div className="space-y-1">
                              {result.metrics.map((metric: any, mIdx: number) => (
                                <div key={mIdx} className="flex items-center justify-between p-2 bg-background/30 rounded">
                                  <span className="font-medium">{metric.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={metric.passed ? 'text-green-600' : 'text-orange-600'}>
                                      {metric.value}{metric.unit}
                                    </span>
                                    <span className="text-muted-foreground">
                                      (target: {metric.benchmark}{metric.unit})
                                    </span>
                                    {metric.passed ? (
                                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-orange-600" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.results?.issues_found && result.results.issues_found.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Issues Found:</p>
                            <ul className="list-disc list-inside space-y-1 text-foreground">
                              {result.results.issues_found.map((issue: string, issueIdx: number) => (
                                <li key={issueIdx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.execution_time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            ⏱️ Execution Time: {result.execution_time}s
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}

          {/* Test Distribution Chart */}
          {testReport.charts_data?.test_distribution && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Test Distribution
              </h4>
              <div className="space-y-3">
                {testReport.charts_data.test_distribution.labels.map((label: string, idx: number) => {
                  const value = testReport.charts_data.test_distribution.values[idx];
                  const color = testReport.charts_data.test_distribution.colors[idx];
                  const percentage = testReport.summary.total_tests > 0
                    ? ((value / testReport.summary.total_tests) * 100).toFixed(1)
                    : 0;

                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">{value} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Performance */}
          {testReport.category_performance && testReport.category_performance.length > 0 && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Category Performance
              </h4>
              <div className="space-y-4">
                {testReport.category_performance.map((cat: any) => {
                  const Icon = categoryIcons[cat.category] || BarChart3;
                  const isPassed = cat.passed;
                  const percentage = (cat.average_score / cat.benchmark) * 100;

                  return (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-medium capitalize">
                            {cat.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isPassed ? 'text-green-600' : 'text-orange-600'}`}>
                            {cat.average_score.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {cat.benchmark}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isPassed ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                        {/* Benchmark line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                          style={{ left: '100%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Performance */}
          {testReport.agent_performance && testReport.agent_performance.length > 0 && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold mb-4">Agent Performance Comparison</h4>
              <div className="space-y-4">
                {testReport.agent_performance.map((agent: any) => (
                  <div key={agent.name} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">🤖 {agent.name}</span>
                      <span className="text-sm font-semibold text-primary">
                        Score: {agent.average_score}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Tests Run</p>
                        <p className="font-medium">{agent.tests_run}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Passed</p>
                        <p className="font-medium text-green-600">{agent.passed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-medium text-red-600">{agent.failed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {testReport.critical_issues && testReport.critical_issues.length > 0 && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4" />
                Critical Issues ({testReport.critical_issues.length})
              </h4>
              <div className="space-y-3">
                {testReport.critical_issues.map((issue: any, idx: number) => (
                  <div key={idx} className="p-3 bg-background rounded-lg border border-red-500/20">
                    <p className="font-medium text-sm mb-1">{issue.issue}</p>
                    {issue.impact && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Impact: {issue.impact}
                      </p>
                    )}
                    {issue.fix && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          📁 {issue.fix.file_path}:{issue.fix.line_number}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleApplyFix(issue)}
                          disabled={applyingFix !== null}
                        >
                          {applyingFix === issue.fix.file_path ? (
                            <>Applying...</>
                          ) : (
                            <>🔧 Apply Fix</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Recommendations */}
          {testReport.recommendations && testReport.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                💡 Recommendations ({testReport.recommendations.length})
              </h4>
              
              {/* Group by severity */}
              {['critical', 'high', 'medium', 'low'].map((severity) => {
                const recommendations = testReport.recommendations.filter(
                  (r: any) => r.severity === severity
                );
                
                if (recommendations.length === 0) return null;

                return (
                  <div key={severity}>
                    <h5 className="text-sm font-semibold mb-2 capitalize">
                      {severity} Priority ({recommendations.length})
                    </h5>
                    <div className="space-y-2">
                      {recommendations.map((rec: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${severityColors[severity as keyof typeof severityColors]}`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">{rec.issue}</p>
                              {rec.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
                                  {rec.category}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold uppercase">
                              {rec.severity}
                            </span>
                          </div>
                          
                          {rec.impact && (
                            <p className="text-xs text-muted-foreground mb-2">
                              💥 Impact: {rec.impact}
                            </p>
                          )}

                          {rec.fix && (
                            <div className="mt-3 p-2 bg-background/50 rounded text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono">
                                  📁 {rec.fix.file_path}:{rec.fix.line_number}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Current:</p>
                                <pre className="p-2 bg-muted rounded overflow-x-auto">
                                  <code>{rec.fix.current_code}</code>
                                </pre>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Suggested:</p>
                                <pre className="p-2 bg-green-500/10 rounded overflow-x-auto">
                                  <code>{rec.fix.suggested_code}</code>
                                </pre>
                              </div>
                              
                              <p className="text-muted-foreground italic">
                                {rec.fix.explanation}
                              </p>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplyFix(rec)}
                                disabled={applyingFix !== null}
                                className="w-full"
                              >
                                {applyingFix === rec.fix.file_path ? (
                                  <>⏳ Applying Fix...</>
                                ) : (
                                  <>🔧 Apply This Fix</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
