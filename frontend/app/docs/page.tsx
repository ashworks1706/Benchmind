'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, BookOpen, Zap, Target, LineChart, Users, Shield, Cpu, GitBranch, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  // Table of contents items
  const tocItems = [
    { id: 'overview', label: 'Overview & Objectives' },
    { id: 'how-it-works', label: 'How AgentLens Works' },
    { id: 'metrics', label: 'Metrics & Calculations' },
    { id: 'agent-collaboration', label: 'Agent Collaboration' },
    { id: 'testing', label: 'Testing Categories' },
    { id: 'objective-focus', label: 'Objective Focus' },
    { id: 'citations', label: 'Citations & References' },
    { id: 'quick-tips', label: 'Quick Tips' },
  ];

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sections = tocItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(tocItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">AgentLens Documentation</h1>
          </div>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="pt-16 flex">
        {/* Main Content - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-3xl px-8 py-12">
            
            {/* Introduction */}
            <section id="overview" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold">Overview & Objectives</h2>
              </div>
              
              <p className="text-lg leading-relaxed mb-6">
                <strong>AgentLens</strong> is a research-grade visualization and testing framework for multi-agent AI systems. 
                Our tool provides deep quantitative analysis of agent architectures, enabling developers to understand, 
                optimize, and validate their AI systems with production-level metrics.
              </p>

              <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100 text-lg">Primary Objectives</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 text-xl">•</span>
                    <span><strong>Visualize Agent Architectures:</strong> Interactive canvas showing agents, tools, and their relationships</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 text-xl">•</span>
                    <span><strong>Quantify Performance:</strong> Research-grade metrics including P50/P95/P99 latencies, success rates, and costs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 text-xl">•</span>
                    <span><strong>Automated Testing:</strong> Generate and execute comprehensive test suites across multiple categories</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1 text-xl">•</span>
                    <span><strong>Intelligent Fixing:</strong> AI-powered code suggestions to resolve test failures and optimize performance</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-8 h-8 text-green-600" />
                <h2 className="text-3xl font-bold">How AgentLens Works</h2>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-3 text-lg">
                    <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center">1</span>
                    Repository Scraping & Analysis
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 ml-11 leading-relaxed">
                    Connect your GitHub repository and our intelligent parser extracts agent definitions, tool implementations, 
                    and relationship patterns. We analyze code structure, function signatures, and documentation to build a 
                    comprehensive system map.
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-3 text-lg">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">2</span>
                    Interactive Visualization
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 ml-11 leading-relaxed">
                    The canvas displays your multi-agent system as an interactive graph. Agents (🤖) are shown with their 
                    connected tools (🔧), and relationships between agents are visualized with detailed metrics. Each component 
                    shows real-time cost, latency (P50), and success rate calculations.
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-3 text-lg">
                    <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center">3</span>
                    Test Generation & Execution
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 ml-11 leading-relaxed">
                    Our AI generates targeted test cases across 6+ categories: tool calling, reasoning, performance, 
                    collaborative, relationship, and security. Tests are executed against your actual system with 1000+ 
                    sample calls for statistical significance.
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-3 text-lg">
                    <span className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center">4</span>
                    Intelligent Fix Recommendations
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 ml-11 leading-relaxed">
                    When tests fail, our system analyzes the root cause and generates specific code fixes. You can review, 
                    approve, and apply fixes directly to your codebase or push them as GitHub pull requests.
                  </p>
                </div>
              </div>
            </section>

            {/* Metrics & Calculations */}
            <section id="metrics" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <LineChart className="w-8 h-8 text-amber-600" />
                <h2 className="text-3xl font-bold">Metrics & Calculations</h2>
              </div>

              <p className="text-lg leading-relaxed mb-6">
                All metrics are <strong>research-grade and quantifiable</strong>, validated against industry benchmarks 
                and measured over 1000+ samples for statistical significance.
              </p>

              <div className="space-y-6">
                <div className="p-6 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-3 text-lg">Latency Percentiles (P50/P95/P99)</h3>
                  <p className="mb-3 leading-relaxed">
                    <strong>Calculation:</strong> Measured over 1000+ API calls, sorted by response time:
                  </p>
                  <ul className="space-y-2 ml-4 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span><strong>P50 (Median):</strong> 50% of requests complete faster than this value - typical user experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span><strong>P95:</strong> 95% of requests complete faster - tail latency for SLA compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span><strong>P99:</strong> 99% of requests complete faster - worst-case scenarios</span>
                    </li>
                  </ul>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Benchmarks:</strong> Based on OpenAI and Anthropic production systems. Target: P50 &lt;200ms, 
                    P95 &lt;500ms, P99 &lt;1000ms.
                  </p>
                </div>

                <div className="p-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-3 text-lg">Success Rate</h3>
                  <p className="mb-3 leading-relaxed">
                    <strong>Calculation:</strong> (successful_executions / total_executions) × 100% over 1000+ calls
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Replaces vague terms like &quot;reliability&quot; with concrete evidence. Color-coded by SLA: 
                    99.9% (green), 99.5% (blue), 99% (yellow), 95% (orange), &lt;95% (red).
                  </p>
                </div>

                <div className="p-6 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-3 text-lg">Cost Per Day</h3>
                  <p className="mb-3 leading-relaxed">
                    <strong>Calculation:</strong> Based on model pricing (GPT-4, Claude, etc.) × estimated daily API calls × token usage
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Factors in: model type, input/output tokens, reasoning complexity, accuracy requirements, 
                    cost optimization level, and speed settings from Objective Focus sliders.
                  </p>
                </div>

                <div className="p-6 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-3 text-lg">Connection Latency Breakdown</h3>
                  <p className="mb-3 leading-relaxed">
                    <strong>Components:</strong> DNS lookup (5ms) + TCP handshake (8ms) + TLS handshake (12ms) + 
                    serialization + network transfer + deserialization
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Each edge shows total latency with detailed component breakdown in tooltips.
                  </p>
                </div>
              </div>
            </section>

            {/* Agent Collaboration */}
            <section id="agent-collaboration" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-indigo-600" />
                <h2 className="text-3xl font-bold">How Agents Work Together</h2>
              </div>

              <p className="text-lg leading-relaxed mb-6">
                Multi-agent systems coordinate through various patterns, each with specific performance characteristics:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-3 text-lg">Sequential Orchestration</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Agents execute in order, passing results to the next. Higher latency (sum of all agents) but 
                    deterministic and easier to debug. Measured end-to-end latency shows cumulative performance.
                  </p>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-3 text-lg">Parallel Execution</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Multiple agents work simultaneously. Latency equals the slowest agent (max, not sum). 
                    Higher throughput but requires careful coordination to avoid conflicts.
                  </p>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-3 text-lg">Hierarchical Delegation</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Manager agents delegate to specialist agents. Success rate depends on routing accuracy (measured 
                    separately) and specialist performance. Connection latency becomes critical.
                  </p>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-3 text-lg">Collaborative Problem Solving</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Agents negotiate and share state. Measured by collaboration efficiency (% improvement over 
                    single-agent baseline) and inter-agent communication overhead.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800 mt-6">
                <h3 className="font-semibold mb-3 text-lg">Relationship Types Visualized</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span><strong>Agent → Tool</strong> (green, vertical): Tool execution with P50/P95/P99 execution times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span><strong>Agent → Agent</strong> (red, curved): Inter-agent communication with connection latency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span><strong>Test → Target</strong> (colored, dashed): Test execution paths with test-specific colors</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Testing Categories */}
            <section id="testing" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold">Testing Categories</h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 border-l-4 border-green-600 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-2 text-lg">🔧 Tool Calling</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Validates tool selection accuracy (≥90%), parameter correctness (≥95%), and execution success rate (≥85%). 
                    Based on ReAct framework (Yao et al., 2023).
                  </p>
                </div>

                <div className="p-5 border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-2 text-lg">🧠 Reasoning</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Tests chain-of-thought quality, logical coherence, and decision accuracy. Benchmarked against 
                    GSM8K and MMLU datasets. Target: ≥85% reasoning score.
                  </p>
                </div>

                <div className="p-5 border-l-4 border-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-2 text-lg">⚡ Performance</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Measures P50/P95/P99 latency, throughput (req/s), and resource utilization. Standards from 
                    OpenAI/Anthropic production systems.
                  </p>
                </div>

                <div className="p-5 border-l-4 border-purple-600 bg-purple-50 dark:bg-purple-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-2 text-lg">🤝 Collaborative</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Evaluates multi-agent coordination efficiency, communication overhead, and collaboration speedup 
                    vs. single-agent baseline. Based on AutoGen framework (Microsoft Research, 2023).
                  </p>
                </div>

                <div className="p-5 border-l-4 border-orange-600 bg-orange-50 dark:bg-orange-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-2 text-lg">🔗 Relationship</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Tests inter-agent connections, message passing correctness, and routing accuracy in complex 
                    agent graphs.
                  </p>
                </div>

                <div className="p-5 border-l-4 border-red-600 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                  <h3 className="font-semibold mb-2 text-lg">🔒 Security</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Validates against prompt injection, data leakage, and unsafe tool execution. Based on 
                    OWASP LLM Top 10 (2024). Target: ≥90% security score.
                  </p>
                </div>
              </div>
            </section>

            {/* Objective Focus */}
            <section id="objective-focus" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-8 h-8 text-yellow-600" />
                <h2 className="text-3xl font-bold">Objective Focus Controls</h2>
              </div>

              <p className="text-lg leading-relaxed mb-6">
                The Objective Focus panel (bottom-right) lets you adjust system priorities, dynamically recalculating 
                all costs and latencies based on your preferences:
              </p>

              <div className="space-y-4">
                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-lg">🧠 Reasoning (0-100)</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Higher = deeper reasoning, more tokens, higher cost and latency. Multiplier: 0.5× to 1.5×
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-lg">🎯 Accuracy (0-100)</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Higher = more validation, retries, higher API calls. Multiplier: 0.5× to 1.5×
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-lg">💰 Cost Optimization (0-100)</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Higher = lower costs but may reduce quality. Inverse multiplier: 1.5× to 0.5×
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-lg">⚡ Speed (0-100)</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Higher = faster responses, lower latency. Inverse multiplier: 1.5× to 0.5×
                  </p>
                </div>
              </div>
            </section>

            {/* Citations & References */}
            <section id="citations" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <GitBranch className="w-8 h-8 text-gray-600" />
                <h2 className="text-3xl font-bold">Citations & References</h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="font-semibold mb-1">LLM Agent Research</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yao et al. (2023). &quot;ReAct: Synergizing Reasoning and Acting in Language Models&quot;
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="font-semibold mb-1">Chain-of-Thought Evaluation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wei et al. (2022). &quot;Chain-of-Thought Prompting Elicits Reasoning in Large Language Models&quot;
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="font-semibold mb-1">Multi-Agent Systems</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Microsoft Research (2023). &quot;AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation&quot;
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="font-semibold mb-1">Production Performance Benchmarks</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    OpenAI and Anthropic Production Guidelines; Artificial Analysis Benchmarks (October 2024)
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="font-semibold mb-1">LLM Security</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    OWASP Foundation (2024). &quot;OWASP Top 10 for Large Language Model Applications&quot;
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="font-semibold mb-1">Agent Orchestration Frameworks</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    LangChain, LangGraph (Harrison Chase, 2024); CrewAI Multi-Agent Framework
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Tips */}
            <section id="quick-tips" className="mb-16 scroll-mt-20">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-cyan-600" />
                <h2 className="text-3xl font-bold">Quick Tips</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <p className="font-semibold mb-2">💡 Click any node or edge</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    View detailed metrics, cost breakdowns, and research context in the Details Panel
                  </p>
                </div>

                <div className="p-5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <p className="font-semibold mb-2">🔍 Zoom with mouse wheel</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Zooms at cursor position. Pan by dragging the canvas background
                  </p>
                </div>

                <div className="p-5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <p className="font-semibold mb-2">📊 Hover over metrics</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Tooltips show P50/P95/P99 percentiles, success rates, and detailed calculations
                  </p>
                </div>

                <div className="p-5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <p className="font-semibold mb-2">🎨 Test routes are dashed</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Colored dashed lines show test execution paths, solid lines show agent connections
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Right Sidebar - Table of Contents */}
        <div className="hidden lg:block w-64 border-l border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              On This Page
            </h3>
            <nav className="space-y-2">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left text-sm py-1.5 px-3 rounded transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-3xl mx-auto px-8">
          <p className="text-sm text-center text-muted-foreground">
            AgentLens v1.0 - Research-Grade Multi-Agent System Analysis Tool
          </p>
        </div>
      </div>
    </div>
  );
}
