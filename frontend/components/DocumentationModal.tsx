'use client';

import { X, BookOpen, Zap, Target, LineChart, Users, Shield, Cpu, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentationModalProps {
  onClose: () => void;
}

export function DocumentationModal({ onClose }: DocumentationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border-2 border-border rounded-xl shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">AgentLens Documentation</h1>
              <p className="text-sm text-muted-foreground">Complete Guide to Multi-Agent System Analysis</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* Introduction */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold">Overview & Objectives</h2>
              </div>
              
              <p className="text-base leading-relaxed">
                <strong>AgentLens</strong> is a research-grade visualization and testing framework for multi-agent AI systems. 
                Our tool provides deep quantitative analysis of agent architectures, enabling developers to understand, 
                optimize, and validate their AI systems with production-level metrics.
              </p>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Primary Objectives</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Visualize Agent Architectures:</strong> Interactive canvas showing agents, tools, and their relationships</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Quantify Performance:</strong> Research-grade metrics including P50/P95/P99 latencies, success rates, and costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Automated Testing:</strong> Generate and execute comprehensive test suites across multiple categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Intelligent Fixing:</strong> AI-powered code suggestions to resolve test failures and optimize performance</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* How It Works */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold">How AgentLens Works</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Repository Scraping & Analysis
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                    Connect your GitHub repository and our intelligent parser extracts agent definitions, tool implementations, 
                    and relationship patterns. We analyze code structure, function signatures, and documentation to build a 
                    comprehensive system map.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Interactive Visualization
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                    The canvas displays your multi-agent system as an interactive graph. Agents (🤖) are shown with their 
                    connected tools (🔧), and relationships between agents are visualized with detailed metrics. Each component 
                    shows real-time cost, latency (P50), and success rate calculations.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Test Generation & Execution
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                    Our AI generates targeted test cases across 6+ categories: tool calling, reasoning, performance, 
                    collaborative, relationship, and security. Tests are executed against your actual system with 1000+ 
                    sample calls for statistical significance.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                    Intelligent Fix Recommendations
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                    When tests fail, our system analyzes the root cause and generates specific code fixes. You can review, 
                    approve, and apply fixes directly to your codebase or push them as GitHub pull requests.
                  </p>
                </div>
              </div>
            </section>

            {/* Metrics & Calculations */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <LineChart className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold">Metrics & Calculations</h2>
              </div>

              <p className="text-base leading-relaxed">
                All metrics are <strong>research-grade and quantifiable</strong>, validated against industry benchmarks 
                and measured over 1000+ samples for statistical significance.
              </p>

              <div className="space-y-3">
                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                  <h3 className="font-semibold mb-2">Latency Percentiles (P50/P95/P99)</h3>
                  <p className="text-sm mb-2">
                    <strong>Calculation:</strong> Measured over 1000+ API calls, sorted by response time:
                  </p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>P50 (Median):</strong> 50% of requests complete faster than this value - typical user experience</li>
                    <li>• <strong>P95:</strong> 95% of requests complete faster - tail latency for SLA compliance</li>
                    <li>• <strong>P99:</strong> 99% of requests complete faster - worst-case scenarios</li>
                  </ul>
                  <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                    <strong>Benchmarks:</strong> Based on OpenAI and Anthropic production systems. Target: P50 &lt;200ms, 
                    P95 &lt;500ms, P99 &lt;1000ms.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <h3 className="font-semibold mb-2">Success Rate</h3>
                  <p className="text-sm mb-2">
                    <strong>Calculation:</strong> (successful_executions / total_executions) × 100% over 1000+ calls
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Replaces vague terms like "reliability" with concrete evidence. Color-coded by SLA: 
                    99.9% (green), 99.5% (blue), 99% (yellow), 95% (orange), &lt;95% (red).
                  </p>
                </div>

                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20">
                  <h3 className="font-semibold mb-2">Cost Per Day</h3>
                  <p className="text-sm mb-2">
                    <strong>Calculation:</strong> Based on model pricing (GPT-4, Claude, etc.) × estimated daily API calls × token usage
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Factors in: model type, input/output tokens, reasoning complexity, accuracy requirements, 
                    cost optimization level, and speed settings from Objective Focus sliders.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <h3 className="font-semibold mb-2">Connection Latency Breakdown</h3>
                  <p className="text-sm mb-2">
                    <strong>Components:</strong> DNS lookup (5ms) + TCP handshake (8ms) + TLS handshake (12ms) + 
                    serialization + network transfer + deserialization
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Each edge shows total latency with detailed component breakdown in tooltips.
                  </p>
                </div>
              </div>
            </section>

            {/* Agent Collaboration */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold">How Agents Work Together</h2>
              </div>

              <p className="text-base leading-relaxed">
                Multi-agent systems coordinate through various patterns, each with specific performance characteristics:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Sequential Orchestration</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Agents execute in order, passing results to the next. Higher latency (sum of all agents) but 
                    deterministic and easier to debug. Measured end-to-end latency shows cumulative performance.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Parallel Execution</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Multiple agents work simultaneously. Latency equals the slowest agent (max, not sum). 
                    Higher throughput but requires careful coordination to avoid conflicts.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Hierarchical Delegation</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Manager agents delegate to specialist agents. Success rate depends on routing accuracy (measured 
                    separately) and specialist performance. Connection latency becomes critical.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Collaborative Problem Solving</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Agents negotiate and share state. Measured by collaboration efficiency (% improvement over 
                    single-agent baseline) and inter-agent communication overhead.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-semibold mb-2">Relationship Types Visualized</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Agent → Tool</strong> (green, vertical): Tool execution with P50/P95/P99 execution times</li>
                  <li>• <strong>Agent → Agent</strong> (red, curved): Inter-agent communication with connection latency</li>
                  <li>• <strong>Test → Target</strong> (colored, dashed): Test execution paths with test-specific colors</li>
                </ul>
              </div>
            </section>

            {/* Testing Categories */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold">Testing Categories</h2>
              </div>

              <div className="space-y-3">
                <div className="p-3 border-l-4 border-green-600 bg-green-50 dark:bg-green-950/20">
                  <h3 className="font-semibold text-sm">🔧 Tool Calling</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Validates tool selection accuracy (≥90%), parameter correctness (≥95%), and execution success rate (≥85%). 
                    Based on ReAct framework (Yao et al., 2023).
                  </p>
                </div>

                <div className="p-3 border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-950/20">
                  <h3 className="font-semibold text-sm">🧠 Reasoning</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Tests chain-of-thought quality, logical coherence, and decision accuracy. Benchmarked against 
                    GSM8K and MMLU datasets. Target: ≥85% reasoning score.
                  </p>
                </div>

                <div className="p-3 border-l-4 border-amber-600 bg-amber-50 dark:bg-amber-950/20">
                  <h3 className="font-semibold text-sm">⚡ Performance</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Measures P50/P95/P99 latency, throughput (req/s), and resource utilization. Standards from 
                    OpenAI/Anthropic production systems.
                  </p>
                </div>

                <div className="p-3 border-l-4 border-purple-600 bg-purple-50 dark:bg-purple-950/20">
                  <h3 className="font-semibold text-sm">🤝 Collaborative</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Evaluates multi-agent coordination efficiency, communication overhead, and collaboration speedup 
                    vs. single-agent baseline. Based on AutoGen framework (Microsoft Research, 2023).
                  </p>
                </div>

                <div className="p-3 border-l-4 border-orange-600 bg-orange-50 dark:bg-orange-950/20">
                  <h3 className="font-semibold text-sm">🔗 Relationship</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Tests inter-agent connections, message passing correctness, and routing accuracy in complex 
                    agent graphs.
                  </p>
                </div>

                <div className="p-3 border-l-4 border-red-600 bg-red-50 dark:bg-red-950/20">
                  <h3 className="font-semibold text-sm">🔒 Security</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Validates against prompt injection, data leakage, and unsafe tool execution. Based on 
                    OWASP LLM Top 10 (2024). Target: ≥90% security score.
                  </p>
                </div>
              </div>
            </section>

            {/* Objective Focus */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold">Objective Focus Controls</h2>
              </div>

              <p className="text-base leading-relaxed">
                The Objective Focus panel (bottom-right) lets you adjust system priorities, dynamically recalculating 
                all costs and latencies based on your preferences:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <h3 className="font-semibold text-sm mb-1">🧠 Reasoning (0-100)</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Higher = deeper reasoning, more tokens, higher cost and latency. Multiplier: 0.5× to 1.5×
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <h3 className="font-semibold text-sm mb-1">🎯 Accuracy (0-100)</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Higher = more validation, retries, higher API calls. Multiplier: 0.5× to 1.5×
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <h3 className="font-semibold text-sm mb-1">💰 Cost Optimization (0-100)</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Higher = lower costs but may reduce quality. Inverse multiplier: 1.5× to 0.5×
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <h3 className="font-semibold text-sm mb-1">⚡ Speed (0-100)</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Higher = faster responses, lower latency. Inverse multiplier: 1.5× to 0.5×
                  </p>
                </div>
              </div>
            </section>

            {/* Citations & References */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <GitBranch className="w-6 h-6 text-gray-600" />
                <h2 className="text-2xl font-bold">Citations & References</h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold">LLM Agent Research</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Yao et al. (2023). "ReAct: Synergizing Reasoning and Acting in Language Models"
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold">Chain-of-Thought Evaluation</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Wei et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold">Multi-Agent Systems</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Microsoft Research (2023). "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation"
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold">Production Performance Benchmarks</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    OpenAI and Anthropic Production Guidelines; Artificial Analysis Benchmarks (October 2024)
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold">LLM Security</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    OWASP Foundation (2024). "OWASP Top 10 for Large Language Model Applications"
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold">Agent Orchestration Frameworks</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    LangChain, LangGraph (Harrison Chase, 2024); CrewAI Multi-Agent Framework
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Tips */}
            <section className="space-y-4 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-cyan-600" />
                <h2 className="text-2xl font-bold">Quick Tips</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded border border-cyan-200 dark:border-cyan-800">
                  <p className="text-sm font-semibold mb-1">💡 Click any node or edge</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    View detailed metrics, cost breakdowns, and research context in the Details Panel
                  </p>
                </div>

                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded border border-cyan-200 dark:border-cyan-800">
                  <p className="text-sm font-semibold mb-1">🔍 Zoom with mouse wheel</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Zooms at cursor position. Pan by dragging the canvas background
                  </p>
                </div>

                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded border border-cyan-200 dark:border-cyan-800">
                  <p className="text-sm font-semibold mb-1">📊 Hover over metrics</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Tooltips show P50/P95/P99 percentiles, success rates, and detailed calculations
                  </p>
                </div>

                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded border border-cyan-200 dark:border-cyan-800">
                  <p className="text-sm font-semibold mb-1">🎨 Test routes are dashed</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Colored dashed lines show test execution paths, solid lines show agent connections
                  </p>
                </div>
              </div>
            </section>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-center text-muted-foreground">
            AgentLens v1.0 - Research-Grade Multi-Agent System Analysis Tool
          </p>
        </div>
      </div>
    </div>
  );
}
