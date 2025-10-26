'use client';

import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useRef } from 'react';
import { TestCase } from '@/types';

interface ResearchReportModalProps {
  testReport: any;
  testCases: TestCase[];
  onClose: () => void;
}

export function ResearchReportModal({ testReport, testCases, onClose }: ResearchReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${testReport.collection_name || 'test-report'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl my-8">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border sticky top-0 bg-white dark:bg-gray-900 z-10 p-6">
          <h2 className="text-xl font-semibold">Research Report</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Research Paper Content */}
        <div
          ref={reportRef}
          className="p-12 space-y-8 bg-white dark:bg-gray-900 research-paper"
          style={{
            fontFamily: "'Crimson Text', 'Georgia', 'Times New Roman', serif",
          }}
        >
          {/* Title Page */}
          <div className="text-center py-12 mb-8 border-b border-border">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {testReport.collection_name || 'AI Agent System Evaluation Report'}
            </h1>
            <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {testReport.collection_description || 'Comprehensive Performance Analysis'}
            </h2>
          </div>

          {/* Abstract */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">Abstract</h2>
            <p className="text-justify leading-relaxed text-gray-700 dark:text-gray-300">
              This report presents a comprehensive evaluation of the AI agent system&apos;s performance across
              multiple dimensions including tool-calling accuracy, reasoning capability, collaborative efficiency,
              and performance metrics. The evaluation follows research-level standards established in academic
              literature and industry best practices. A total of {testReport.summary.total_tests} tests were
              executed with a {testReport.summary.success_rate}% success rate, providing quantitative insights
              into system capabilities and areas for improvement.
            </p>
          </section>

          {/* Test Guidelines */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">1. Evaluation Methodology</h2>
            
            <h3 className="text-xl font-semibold mt-4">1.1 Test Categories and Guidelines</h3>
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded">
                <h4 className="font-bold mb-2">Tool Calling Assessment</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Objective:</strong> Evaluate accuracy of tool selection and parameter generation.
                  Based on ReAct framework (Yao et al., 2023) and ToolLLM benchmarks (Qin et al., 2023).
                  Acceptance criteria: ≥90% tool accuracy, ≥95% parameter correctness.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded">
                <h4 className="font-bold mb-2">Reasoning Capability</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Objective:</strong> Assess logical coherence and step-by-step reasoning quality.
                  Grounded in Chain-of-Thought prompting research (Wei et al., 2022) and validated against
                  GSM8K and MMLU benchmarks. Target: ≥85% reasoning score.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded">
                <h4 className="font-bold mb-2">Collaborative Efficiency</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Objective:</strong> Measure inter-agent communication and task coordination.
                  Based on AutoGen multi-agent patterns (Wu et al., 2023). Benchmark: ≥85% collaboration
                  efficiency with 1.5x speedup vs. single-agent baseline.
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded">
                <h4 className="font-bold mb-2">Performance Metrics</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Objective:</strong> Evaluate response latency and throughput under load.
                  Standards from OpenAI and Anthropic production systems. Targets: p95 latency {'<'}500ms,
                  throughput ≥10 req/s.
                </p>
              </div>
            </div>
          </section>

          {/* Summary Statistics */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">2. Executive Summary</h2>
            
            <div className="grid grid-cols-4 gap-4 my-6">
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold">{testReport.summary.total_tests}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-green-600">{testReport.summary.passed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-red-600">{testReport.summary.failed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-blue-600">{testReport.summary.success_rate}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
            </div>
          </section>

          {/* Category Performance with Visual Charts */}
          {testReport.category_performance && testReport.category_performance.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b pb-2">2.1 Category Performance Analysis</h2>
              
              <div className="space-y-4">
                {testReport.category_performance.map((cat: any, idx: number) => {
                  const percentage = Math.min((cat.average_score / cat.benchmark) * 100, 150);
                  const isPassed = cat.average_score >= cat.benchmark;
                  const deviationNum = ((cat.average_score - cat.benchmark) / cat.benchmark * 100);
                  const deviation = deviationNum.toFixed(1);
                  
                  return (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold capitalize">
                          {cat.category.replace(/_/g, ' ')}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Score: <span className="font-bold">{cat.average_score.toFixed(1)}</span>
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Target: <span className="font-bold">{cat.benchmark}</span>
                          </span>
                          <span className={`text-sm font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                            {deviationNum > 0 ? '+' : ''}{deviation}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isPassed 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                        {/* Benchmark indicator */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                          style={{ left: '100%' }}
                          title={`Target: ${cat.benchmark}`}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>0</span>
                        <span className="font-medium text-blue-600">Target: {cat.benchmark}</span>
                        <span>{(cat.benchmark * 1.5).toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Agent Performance Comparison */}
          {testReport.agent_performance && testReport.agent_performance.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b pb-2">2.2 Agent Performance Comparison</h2>
              
              <div className="space-y-3">
                {testReport.agent_performance.map((agent: any, idx: number) => {
                  const successRate = agent.tests_run > 0 
                    ? (agent.passed / agent.tests_run * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <div key={idx} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600">{agent.passed} passed</span>
                          <span className="text-red-600">{agent.failed} failed</span>
                          <span className="font-bold">{successRate}%</span>
                        </div>
                      </div>
                      
                      {/* Agent progress bar */}
                      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Benchmark Results Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">3. Benchmark Results</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <caption className="text-left italic mb-3 text-gray-600">
                  Table 1: Performance evaluation across test categories with measured values compared to industry benchmarks
                </caption>
                <thead>
                  <tr className="border-b-2 border-gray-800 dark:border-gray-200">
                    <th className="text-left p-2 font-bold">Test Case</th>
                    <th className="text-left p-2 font-bold">Category</th>
                    <th className="text-left p-2 font-bold">Metric</th>
                    <th className="text-right p-2 font-bold">Measured</th>
                    <th className="text-right p-2 font-bold">Benchmark</th>
                    <th className="text-right p-2 font-bold">Δ (%)</th>
                    <th className="text-center p-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {testReport.test_results?.slice(0, 10).map((result: any, idx: number) => (
                    result.metrics?.map((metric: any, mIdx: number) => {
                      const deviation = metric.benchmark > 0 
                        ? ((metric.value - metric.benchmark) / metric.benchmark * 100) 
                        : 0;
                      return (
                        <tr key={`${idx}-${mIdx}`} className="border-b border-gray-300">
                          <td className="p-2 text-xs">{result.test_name || `Test ${idx + 1}`}</td>
                          <td className="p-2 text-xs">{result.category || 'General'}</td>
                          <td className="p-2 text-xs text-gray-600">{metric.name}</td>
                          <td className="p-2 text-right font-semibold">{metric.value.toFixed(1)}{metric.unit}</td>
                          <td className="p-2 text-right text-gray-600">{metric.benchmark}{metric.unit}</td>
                          <td className={`p-2 text-right font-bold ${deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}
                          </td>
                          <td className="p-2 text-center">{metric.passed ? '✓' : '✗'}</td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mathematical Formulation */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">4. Mathematical Formulation</h2>
            
            <div className="space-y-4 text-sm">
              <p className="leading-relaxed">
                The performance deviation metric <em>Δ</em> is calculated as:
              </p>
              <div className="text-center my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-lg"><em>Δ</em> = ((<em>M</em> - <em>B</em>) / <em>B</em>) × 100%</p>
              </div>
              <p className="leading-relaxed">
                where <em>M</em> represents the measured value and <em>B</em> represents the benchmark value.
                Positive <em>Δ</em> indicates performance above benchmark, while negative <em>Δ</em> indicates
                below-benchmark performance.
              </p>
              
              <p className="leading-relaxed mt-4">
                Overall system performance score <em>S</em> is computed as:
              </p>
              <div className="text-center my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-lg"><em>S</em> = (1/<em>N</em>) Σ<sub><em>i</em>=1</sub><sup><em>N</em></sup> <em>w</em><sub><em>i</em></sub> · min(<em>M</em><sub><em>i</em></sub>/<em>B</em><sub><em>i</em></sub>, 1.5)</p>
              </div>
              <p className="leading-relaxed">
                where <em>N</em> is the number of tests, <em>w</em><sub><em>i</em></sub> are category-specific weights,
                and the score is capped at 1.5 to prevent outliers from skewing results.
              </p>
            </div>
          </section>

          {/* Recommendations & Suggested Fixes */}
          {testReport.recommendations && testReport.recommendations.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b pb-2">4. Recommendations & Suggested Fixes</h2>
              
              {/* Critical Issues */}
              {testReport.critical_issues && testReport.critical_issues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3 text-red-600 dark:text-red-400">
                    4.1 Critical Issues
                  </h3>
                  <div className="space-y-3">
                    {testReport.critical_issues.map((issue: any, idx: number) => (
                      <div key={idx} className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">⚠️</span>
                          <div className="flex-1">
                            <h4 className="font-bold text-red-900 dark:text-red-100 mb-1">
                              {issue.title || 'Critical Issue'}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {issue.description}
                            </p>
                            {issue.fix && (
                              <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold mb-1">Suggested Fix:</p>
                                <p className="text-sm font-mono text-green-700 dark:text-green-300">
                                  {issue.fix.description || issue.fix}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Recommendations */}
              <div>
                <h3 className="text-xl font-semibold mb-3">4.2 Improvement Recommendations</h3>
                <div className="space-y-3">
                  {testReport.recommendations.slice(0, 10).map((rec: any, idx: number) => {
                    const severityColors: any = {
                      critical: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                      high: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
                      medium: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
                      low: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                    };
                    const colorClass = severityColors[rec.severity] || severityColors.medium;

                    return (
                      <div key={idx} className={`p-4 border rounded ${colorClass}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-white dark:bg-gray-900">
                                {rec.severity}
                              </span>
                              <h4 className="font-semibold text-sm">
                                {rec.title || rec.test_name}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {rec.description}
                            </p>
                            {rec.fix && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                                <p className="font-semibold mb-1">💡 Suggested Fix:</p>
                                {rec.fix.file_path && (
                                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                                    File: <code className="font-mono">{rec.fix.file_path}</code>
                                  </p>
                                )}
                                <p className="font-mono text-green-700 dark:text-green-300">
                                  {rec.fix.description || rec.fix.code || rec.fix}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* References */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">References</h2>
            <div className="space-y-2 text-sm">
              <p className="pl-6 -indent-6">
                [1] Wei, J., Wang, X., Schuurmans, D., et al. (2022). Chain-of-Thought Prompting Elicits
                Reasoning in Large Language Models. <em>Advances in Neural Information Processing Systems</em>, 35.
              </p>
              <p className="pl-6 -indent-6">
                [2] Yao, S., Zhao, J., Yu, D., et al. (2023). ReAct: Synergizing Reasoning and Acting in
                Language Models. <em>International Conference on Learning Representations</em>.
              </p>
              <p className="pl-6 -indent-6">
                [3] Wu, Q., Bansal, G., Zhang, J., et al. (2023). AutoGen: Enabling Next-Gen LLM Applications
                via Multi-Agent Conversation. <em>arXiv preprint arXiv:2308.08155</em>.
              </p>
              <p className="pl-6 -indent-6">
                [4] Qin, Y., Liang, S., Ye, Y., et al. (2023). ToolLLM: Facilitating Large Language Models to
                Master 16000+ Real-world APIs. <em>arXiv preprint arXiv:2307.16789</em>.
              </p>
              <p className="pl-6 -indent-6">
                [5] OWASP Foundation (2024). OWASP Top 10 for Large Language Model Applications.
              </p>
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        
        .research-paper {
          font-size: 14px;
          line-height: 1.6;
        }
        
        .research-paper h1 {
          font-size: 2.5rem;
          line-height: 1.2;
        }
        
        .research-paper h2 {
          font-size: 1.75rem;
          margin-top: 2rem;
        }
        
        .research-paper h3 {
          font-size: 1.25rem;
          margin-top: 1rem;
        }
        
        .research-paper p {
          margin: 0.75rem 0;
        }
        
        @media print {
          .research-paper {
            background: white !important;
          }
          
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
