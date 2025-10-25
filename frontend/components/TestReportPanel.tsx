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
  Wrench,
  Info,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { useState } from 'react';
import { apiService } from '@/lib/api';
import { Fix } from '@/types';

// Research-level metric definitions
const METRIC_DEFINITIONS = {
  'Tool Accuracy': {
    description: 'Measures the precision of tool selection and parameter passing in agent workflows',
    research_context: 'Based on LangChain and AutoGPT benchmarks for tool-calling accuracy in multi-agent systems',
    benchmark_ranges: {
      excellent: { min: 95, color: 'text-green-600' },
      good: { min: 85, color: 'text-blue-600' },
      acceptable: { min: 75, color: 'text-yellow-600' },
      poor: { min: 0, color: 'text-red-600' }
    },
    industry_standard: 90,
    citations: 'ReAct: Synergizing Reasoning and Acting (Yao et al., 2023)',
  },
  'Routing Accuracy': {
    description: 'Evaluates decision-making accuracy in routing tasks to appropriate agents or tools',
    research_context: 'Derived from research on agentic routing systems and task delegation in LLM orchestration',
    benchmark_ranges: {
      excellent: { min: 93, color: 'text-green-600' },
      good: { min: 80, color: 'text-blue-600' },
      acceptable: { min: 70, color: 'text-yellow-600' },
      poor: { min: 0, color: 'text-red-600' }
    },
    industry_standard: 85,
    citations: 'Multi-Agent Collaboration in LangGraph (Harrison Chase, 2024)',
  },
  'Response Time': {
    description: 'Measures end-to-end latency from input to output in milliseconds',
    research_context: 'Performance benchmarks from production LLM agent systems and real-time application requirements',
    benchmark_ranges: {
      excellent: { max: 300, color: 'text-green-600' },
      good: { max: 500, color: 'text-blue-600' },
      acceptable: { max: 1000, color: 'text-yellow-600' },
      poor: { min: 1000, color: 'text-red-600' }
    },
    industry_standard: 500,
    unit: 'ms',
    citations: 'LLM Latency Optimization (OpenAI, Anthropic Production Guidelines)',
  },
  'Reasoning Score': {
    description: 'Quantifies logical reasoning capabilities, chain-of-thought quality, and decision coherence',
    research_context: 'Based on CoT (Chain of Thought) evaluation metrics and reasoning benchmarks like GSM8K, MMLU',
    benchmark_ranges: {
      excellent: { min: 90, color: 'text-green-600' },
      good: { min: 80, color: 'text-blue-600' },
      acceptable: { min: 70, color: 'text-yellow-600' },
      poor: { min: 0, color: 'text-red-600' }
    },
    industry_standard: 85,
    citations: 'Chain-of-Thought Prompting (Wei et al., 2022)',
  },
  'Collaboration Efficiency': {
    description: 'Measures effectiveness of inter-agent communication and collaborative problem-solving',
    research_context: 'Multi-agent system efficiency metrics from distributed AI research and swarm intelligence',
    benchmark_ranges: {
      excellent: { min: 90, color: 'text-green-600' },
      good: { min: 80, color: 'text-blue-600' },
      acceptable: { min: 70, color: 'text-yellow-600' },
      poor: { min: 0, color: 'text-red-600' }
    },
    industry_standard: 85,
    citations: 'AutoGen: Enabling Next-Gen LLM Applications (Microsoft Research, 2023)',
  },
  'Security Score': {
    description: 'Evaluates vulnerability to prompt injection, data leakage, and unsafe tool execution',
    research_context: 'Based on OWASP LLM Top 10 and AI security research from academic and industry sources',
    benchmark_ranges: {
      excellent: { min: 95, color: 'text-green-600' },
      good: { min: 85, color: 'text-blue-600' },
      acceptable: { min: 75, color: 'text-yellow-600' },
      poor: { min: 0, color: 'text-red-600' }
    },
    industry_standard: 90,
    citations: 'OWASP Top 10 for LLM Applications (2024)',
  },
};

export default function TestReportPanel() {
  const { testReport, setPanelView, addStatusMessage, agentData, addQueuedChange } = useStore();
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const handleBackToTests = () => {
    setPanelView('testing');
  };

  const getMetricInfo = (metricName: string) => {
    // Try to match metric name with definitions (case-insensitive, fuzzy)
    const normalizedName = metricName.toLowerCase().replace(/_/g, ' ');
    for (const [key, value] of Object.entries(METRIC_DEFINITIONS)) {
      if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
        return value;
      }
    }
    return null;
  };

  const getMetricColor = (metricName: string, value: number, unit: string = '') => {
    const info = getMetricInfo(metricName);
    if (!info) return 'text-blue-600';

    const ranges = info.benchmark_ranges;
    
    // For time-based metrics (lower is better)
    if (unit === 'ms' && 'max' in ranges.excellent) {
      if (value <= ranges.excellent.max) return ranges.excellent.color;
      if ('max' in ranges.good && value <= ranges.good.max) return ranges.good.color;
      if ('max' in ranges.acceptable && value <= ranges.acceptable.max) return ranges.acceptable.color;
      return ranges.poor.color;
    }
    
    // For score-based metrics (higher is better)
    if ('min' in ranges.excellent && value >= ranges.excellent.min) return ranges.excellent.color;
    if ('min' in ranges.good && value >= ranges.good.min) return ranges.good.color;
    if ('min' in ranges.acceptable && value >= ranges.acceptable.min) return ranges.acceptable.color;
    return ranges.poor.color;
  };

  const renderMetricGraph = (metricName: string, value: number, benchmark: number, unit: string = '') => {
    const percentage = Math.min((value / benchmark) * 100, 100);
    const isPassed = value >= benchmark;
    
    return (
      <div className="space-y-2">
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isPassed ? 'bg-linear-to-r from-green-500 to-emerald-500' : 'bg-linear-to-r from-orange-500 to-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
          {/* Benchmark indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
            style={{ left: '100%' }}
            title={`Target: ${benchmark}${unit}`}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-600" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0{unit}</span>
          <span className="font-medium text-blue-600">Target: {benchmark}{unit}</span>
          <span>{benchmark * 1.2}{unit}</span>
        </div>
      </div>
    );
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
      // Queue the fix instead of applying immediately
      addQueuedChange({
        type: 'fix',
        description: `Fix: ${recommendation.issue} in ${recommendation.fix.file_path}`,
        data: { recommendation, agentData },
      });

      addStatusMessage({
        type: 'success',
        message: `✅ Fix queued: ${recommendation.issue}`,
      });
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `❌ Failed to queue fix: ${error.message}`,
      });
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
                Category Performance - Research-Level Analysis
              </h4>
              <div className="space-y-6">
                {testReport.category_performance.map((cat: any) => {
                  const Icon = categoryIcons[cat.category] || BarChart3;
                  const isPassed = cat.passed;
                  const metricInfo = getMetricInfo(cat.category);
                  const isExpanded = expandedMetric === cat.category;

                  return (
                    <div key={cat.category} className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                      {/* Category Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-primary" />
                          <div>
                            <span className="font-semibold capitalize text-lg">
                              {cat.category.replace('_', ' ')}
                            </span>
                            {metricInfo && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {metricInfo.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getMetricColor(cat.category, cat.average_score)}`}>
                              {cat.average_score.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Target: {cat.benchmark}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedMetric(isExpanded ? null : cat.category)}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Graph */}
                      {renderMetricGraph(cat.category, cat.average_score, cat.benchmark)}

                      {/* Expanded Research Details */}
                      {isExpanded && metricInfo && (
                        <div className="mt-4 p-4 bg-background rounded-lg border border-border space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Award className="w-4 h-4 text-yellow-600" />
                            Research Context
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-primary">Context: </span>
                              <span className="text-muted-foreground">{metricInfo.research_context}</span>
                            </div>
                            
                            <div>
                              <span className="font-medium text-primary">Industry Standard: </span>
                              <span className="font-semibold">{metricInfo.industry_standard}{'unit' in metricInfo ? metricInfo.unit : '%'}</span>
                            </div>

                            <div>
                              <span className="font-medium text-primary">Benchmark Ranges:</span>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {'min' in metricInfo.benchmark_ranges.excellent && (
                                  <>
                                    <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
                                      <div className="text-xs text-green-700 dark:text-green-300 font-medium">Excellent</div>
                                      <div className="text-lg font-bold">≥{metricInfo.benchmark_ranges.excellent.min}%</div>
                                    </div>
                                    {'min' in metricInfo.benchmark_ranges.good && (
                                      <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
                                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Good</div>
                                        <div className="text-lg font-bold">≥{metricInfo.benchmark_ranges.good.min}%</div>
                                      </div>
                                    )}
                                    {'min' in metricInfo.benchmark_ranges.acceptable && (
                                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                                        <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Acceptable</div>
                                        <div className="text-lg font-bold">≥{metricInfo.benchmark_ranges.acceptable.min}%</div>
                                      </div>
                                    )}
                                    {'min' in metricInfo.benchmark_ranges.acceptable && (
                                      <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                                        <div className="text-xs text-red-700 dark:text-red-300 font-medium">Needs Improvement</div>
                                        <div className="text-lg font-bold">&lt;{metricInfo.benchmark_ranges.acceptable.min}%</div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border">
                              <span className="font-medium text-primary">Citation: </span>
                              <span className="text-xs text-muted-foreground italic">{metricInfo.citations}</span>
                            </div>
                          </div>

                          {/* Your System's Performance */}
                          <div className="pt-3 border-t border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-sm">Your System's Performance</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="p-3 rounded-lg bg-background border border-border">
                                <div className="text-xs text-muted-foreground mb-1">Current Score</div>
                                <div className={`text-2xl font-bold ${getMetricColor(cat.category, cat.average_score)}`}>
                                  {cat.average_score.toFixed(1)}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-background border border-border">
                                <div className="text-xs text-muted-foreground mb-1">vs. Target</div>
                                <div className={`text-2xl font-bold ${cat.average_score >= cat.benchmark ? 'text-green-600' : 'text-orange-600'}`}>
                                  {cat.average_score >= cat.benchmark ? '+' : ''}{(cat.average_score - cat.benchmark).toFixed(1)}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-background border border-border">
                                <div className="text-xs text-muted-foreground mb-1">vs. Industry</div>
                                <div className={`text-2xl font-bold ${cat.average_score >= metricInfo.industry_standard ? 'text-green-600' : 'text-orange-600'}`}>
                                  {cat.average_score >= metricInfo.industry_standard ? '+' : ''}{(cat.average_score - metricInfo.industry_standard).toFixed(1)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                        >
                          ➕ Queue Fix
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
                                className="w-full"
                              >
                                ➕ Queue This Fix
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
