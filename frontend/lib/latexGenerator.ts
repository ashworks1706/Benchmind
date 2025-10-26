/**
 * Generate LaTeX table for test results - Research-level presentation
 */

export interface BenchmarkTableData {
  testCase: string;
  category: string;
  targetElement: string;
  metricName: string;
  measuredValue: number;
  benchmark: number;
  unit: string;
  status: 'passed' | 'failed' | 'warning';
  deviation: number; // Percentage deviation from benchmark
}

export function generateLatexBenchmarkTable(results: BenchmarkTableData[]): string {
  const latex = `
\\begin{table}[h!]
\\centering
\\caption{AI Agent System Performance Evaluation - Benchmark Results}
\\label{tab:benchmark_results}
\\begin{tabular}{|l|l|l|l|r|r|r|c|}
\\hline
\\textbf{Test Case} & \\textbf{Category} & \\textbf{Target} & \\textbf{Metric} & \\textbf{Measured} & \\textbf{Benchmark} & \\textbf{$\\Delta$ (\\%)} & \\textbf{Status} \\\\
\\hline
${results.map(row => {
  const status = row.status === 'passed' ? '\\checkmark' : row.status === 'failed' ? '\\times' : '$\\sim$';
  const color = row.status === 'passed' ? 'green' : row.status === 'failed' ? 'red' : 'orange';
  return `${escapeLatex(row.testCase)} & ${escapeLatex(row.category)} & ${escapeLatex(row.targetElement)} & ${escapeLatex(row.metricName)} & ${row.measuredValue}${row.unit} & ${row.benchmark}${row.unit} & ${row.deviation >= 0 ? '+' : ''}${row.deviation.toFixed(1)} & \\textcolor{${color}}{${status}} \\\\`;
}).join('\n\\hline\n')}
\\hline
\\end{tabular}
\\end{table}

% Additional analysis section
\\subsection{Performance Analysis}

\\textbf{Summary Statistics:}
\\begin{itemize}
    \\item Total Tests Executed: ${results.length}
    \\item Passed: ${results.filter(r => r.status === 'passed').length} (${(results.filter(r => r.status === 'passed').length / results.length * 100).toFixed(1)}\\%)
    \\item Failed: ${results.filter(r => r.status === 'failed').length} (${(results.filter(r => r.status === 'failed').length / results.length * 100).toFixed(1)}\\%)
    \\item Warnings: ${results.filter(r => r.status === 'warning').length} (${(results.filter(r => r.status === 'warning').length / results.length * 100).toFixed(1)}\\%)
\\end{itemize}

\\textbf{Key Findings:}
\\begin{itemize}
${generateKeyFindings(results)}
\\end{itemize}

\\textbf{Mathematical Formulation:}

The performance deviation metric $\\Delta$ is calculated as:
$$
\\Delta = \\frac{M - B}{B} \\times 100\\%
$$
where $M$ is the measured value and $B$ is the benchmark value. Positive $\\Delta$ indicates performance above benchmark (desirable for accuracy metrics), while negative $\\Delta$ indicates below-benchmark performance.

Overall system performance score $S$ is computed as:
$$
S = \\frac{1}{N} \\sum_{i=1}^{N} w_i \\cdot \\min\\left(\\frac{M_i}{B_i}, 1.5\\right)
$$
where $N$ is the number of tests, $w_i$ are category-specific weights, $M_i$ are measured values, and $B_i$ are benchmarks. The score is capped at 1.5 to prevent outliers from skewing results.
`;

  return latex;
}

export function generateLatexCategoryPerformance(categoryData: { category: string; avgScore: number; benchmark: number; tests: number }[]): string {
  return `
\\begin{table}[h!]
\\centering
\\caption{Performance by Test Category}
\\label{tab:category_performance}
\\begin{tabular}{|l|r|r|r|c|}
\\hline
\\textbf{Category} & \\textbf{Avg Score} & \\textbf{Benchmark} & \\textbf{Tests} & \\textbf{Status} \\\\
\\hline
${categoryData.map(cat => {
  const status = cat.avgScore >= cat.benchmark ? '\\checkmark' : '\\times';
  const color = cat.avgScore >= cat.benchmark ? 'green' : 'red';
  return `${escapeLatex(cat.category)} & ${cat.avgScore.toFixed(1)} & ${cat.benchmark.toFixed(1)} & ${cat.tests} & \\textcolor{${color}}{${status}} \\\\`;
}).join('\n\\hline\n')}
\\hline
\\end{tabular}
\\end{table}
`;
}

export function generateLatexAgentComparison(agentData: { agent: string; testsRun: number; avgScore: number; passed: number; failed: number }[]): string {
  return `
\\begin{table}[h!]
\\centering
\\caption{Agent-Level Performance Comparison}
\\label{tab:agent_comparison}
\\begin{tabular}{|l|r|r|r|r|}
\\hline
\\textbf{Agent} & \\textbf{Tests} & \\textbf{Avg Score} & \\textbf{Passed} & \\textbf{Failed} \\\\
\\hline
${agentData.map(agent => {
  return `${escapeLatex(agent.agent)} & ${agent.testsRun} & ${agent.avgScore.toFixed(1)} & ${agent.passed} & ${agent.failed} \\\\`;
}).join('\n\\hline\n')}
\\hline
\\end{tabular}
\\end{table}
`;
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function generateKeyFindings(results: BenchmarkTableData[]): string {
  const findings: string[] = [];
  
  // Find best performing category
  const categories = [...new Set(results.map(r => r.category))];
  const categoryPerf = categories.map(cat => {
    const catResults = results.filter(r => r.category === cat);
    const avgDeviation = catResults.reduce((sum, r) => sum + r.deviation, 0) / catResults.length;
    return { category: cat, avgDeviation };
  });
  categoryPerf.sort((a, b) => b.avgDeviation - a.avgDeviation);
  
  if (categoryPerf.length > 0) {
    findings.push(`    \\item \\textbf{Best Performing Category:} ${escapeLatex(categoryPerf[0].category)} (avg deviation: +${categoryPerf[0].avgDeviation.toFixed(1)}\\%)`);
    if (categoryPerf.length > 1) {
      findings.push(`    \\item \\textbf{Needs Improvement:} ${escapeLatex(categoryPerf[categoryPerf.length - 1].category)} (avg deviation: ${categoryPerf[categoryPerf.length - 1].avgDeviation.toFixed(1)}\\%)`);
    }
  }
  
  // Critical failures
  const criticalFailures = results.filter(r => r.status === 'failed' && r.deviation < -20);
  if (criticalFailures.length > 0) {
    findings.push(`    \\item \\textbf{Critical Issues:} ${criticalFailures.length} test(s) failed with >20\\% deviation from benchmark`);
  }
  
  // Outstanding performance
  const outstanding = results.filter(r => r.status === 'passed' && r.deviation > 10);
  if (outstanding.length > 0) {
    findings.push(`    \\item \\textbf{Exceptional Performance:} ${outstanding.length} test(s) exceeded benchmark by >10\\%`);
  }
  
  return findings.join('\n');
}

/**
 * Convert test results to LaTeX-ready benchmark data
 */
export function convertResultsToTableData(testReport: any): BenchmarkTableData[] {
  const tableData: BenchmarkTableData[] = [];
  
  if (!testReport || !testReport.test_results) return tableData;
  
  testReport.test_results.forEach((result: any) => {
    if (!result.metrics) return;
    
    result.metrics.forEach((metric: any) => {
      tableData.push({
        testCase: result.test_name || result.test_id || 'Unknown',
        category: result.category || 'General',
        targetElement: result.target || 'System',
        metricName: metric.name || 'Metric',
        measuredValue: metric.value || 0,
        benchmark: metric.benchmark || 100,
        unit: metric.unit || '%',
        status: metric.passed ? 'passed' : result.status === 'warning' ? 'warning' : 'failed',
        deviation: metric.benchmark > 0 ? ((metric.value - metric.benchmark) / metric.benchmark * 100) : 0,
      });
    });
  });
  
  return tableData;
}

/**
 * Generate complete LaTeX document for test report
 */
export function generateCompleteLatexReport(testReport: any): string {
  const tableData = convertResultsToTableData(testReport);
  
  const categoryData = testReport.category_performance?.map((cat: any) => ({
    category: cat.category,
    avgScore: cat.average_score,
    benchmark: cat.benchmark,
    tests: cat.tests_count || 0,
  })) || [];
  
  const agentData = testReport.agent_performance?.map((agent: any) => ({
    agent: agent.name,
    testsRun: agent.tests_run,
    avgScore: agent.average_score,
    passed: agent.passed,
    failed: agent.failed,
  })) || [];
  
  return `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\usepackage{amsmath}
\\usepackage{booktabs}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{AI Agent System Performance Evaluation Report}
\\author{Automated Testing Framework}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Executive Summary}
This report presents a comprehensive evaluation of the AI agent system's performance across multiple dimensions including tool-calling accuracy, reasoning capability, collaborative efficiency, and performance metrics. The evaluation follows research-level standards established in academic literature and industry best practices.

\\section{Methodology}
All tests were conducted using standardized benchmarks derived from:
\\begin{itemize}
    \\item ReAct framework (Tool Calling)
    \\item Chain-of-Thought evaluation (Reasoning)
    \\item AutoGen multi-agent patterns (Collaboration)
    \\item Production LLM system SLIs/SLOs (Performance)
\\end{itemize}

${generateLatexBenchmarkTable(tableData)}

${categoryData.length > 0 ? generateLatexCategoryPerformance(categoryData) : ''}

${agentData.length > 0 ? generateLatexAgentComparison(agentData) : ''}

\\section{Conclusions and Recommendations}
Based on the evaluation results, the following recommendations are provided:
\\begin{enumerate}
    \\item \\textbf{Priority 1:} Address any failed tests with >20\\% deviation from benchmarks
    \\item \\textbf{Priority 2:} Optimize warning-level metrics to reach target benchmarks
    \\item \\textbf{Priority 3:} Maintain and monitor currently passing tests to prevent regression
\\end{enumerate}

\\section{References}
\\begin{itemize}
    \\item Wei et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models.
    \\item Yao et al. (2023). ReAct: Synergizing Reasoning and Acting in Language Models.
    \\item Wu et al. (2023). AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation.
    \\item OWASP Top 10 for LLM Applications (2024).
\\end{itemize}

\\end{document}
`;
}
