'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TestGuideline {
  testId: string;
  testName: string;
  category: string;
  researchContext: string;
  evaluationCriteria: string;
  scientificBasis: string;
  acceptanceCriteria: string;
  industryBenchmarks: string;
  measurementProtocol: string;
  citations: string;
}

interface TestGuidelinesProps {
  guideline: TestGuideline;
  compact?: boolean;
}

export function TestGuidelineTooltip({ guideline, compact = false }: TestGuidelinesProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
          title="View test guidelines"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Tooltip Content */}
            <div className="absolute left-0 top-full mt-2 z-50 w-96 max-h-[500px] overflow-y-auto bg-background border-2 border-blue-500/30 rounded-lg shadow-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300">
                    Test Guidelines
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {guideline.testName}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <Section
                  title="🎯 Research Context"
                  content={guideline.researchContext}
                />
                <Section
                  title="📊 Evaluation Criteria"
                  content={guideline.evaluationCriteria}
                />
                <Section
                  title="🔬 Scientific Basis"
                  content={guideline.scientificBasis}
                />
                <Section
                  title="✅ Acceptance Criteria"
                  content={guideline.acceptanceCriteria}
                />
                <Section
                  title="📈 Industry Benchmarks"
                  content={guideline.industryBenchmarks}
                />
                <Section
                  title="🧪 Measurement Protocol"
                  content={guideline.measurementProtocol}
                />
                <Section
                  title="📚 Citations"
                  content={guideline.citations}
                  className="border-t pt-2"
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="font-semibold text-blue-700 dark:text-blue-300">
          Research-Level Test Guidelines
        </h4>
      </div>

      <div className="space-y-3 text-sm">
        <Section
          title="🎯 Research Context"
          content={guideline.researchContext}
        />
        <Section
          title="📊 Evaluation Criteria"
          content={guideline.evaluationCriteria}
        />
        <Section
          title="🔬 Scientific Basis"
          content={guideline.scientificBasis}
        />
        <Section
          title="✅ Acceptance Criteria"
          content={guideline.acceptanceCriteria}
        />
        <Section
          title="📈 Industry Benchmarks"
          content={guideline.industryBenchmarks}
        />
        <Section
          title="🧪 Measurement Protocol"
          content={guideline.measurementProtocol}
        />
        <Section
          title="📚 Citations"
          content={guideline.citations}
          className="border-t pt-2 italic text-xs"
        />
      </div>
    </div>
  );
}

function Section({ title, content, className = '' }: { title: string; content: string; className?: string }) {
  return (
    <div className={className}>
      <p className="font-semibold text-primary mb-1">{title}</p>
      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}

/**
 * Generate research-level guidelines for a test case
 */
export function generateTestGuideline(testCase: any): TestGuideline {
  const category = testCase.category || 'general';
  
  const guidelines: Record<string, Omit<TestGuideline, 'testId' | 'testName' | 'category'>> = {
    tool_calling: {
      researchContext: 'Tool-calling evaluation is based on ReAct (Reasoning and Acting) framework research, which demonstrates that LLM agents require accurate tool selection and parameter generation to execute complex tasks effectively.',
      evaluationCriteria: 'Measures accuracy of tool selection, correctness of parameter passing, success rate of tool execution, and appropriateness of tool sequencing in multi-step workflows.',
      scientificBasis: 'Based on benchmarks from AutoGPT, LangChain evaluation suite, and tool-use datasets like ToolBench and API-Bank. Validates agent capability to ground reasoning in external actions.',
      acceptanceCriteria: 'Tool accuracy ≥90%, parameter correctness ≥95%, execution success rate ≥85%. Failures in tool calling directly impact task completion and user satisfaction.',
      industryBenchmarks: 'Production LLM agents (GPT-4 Tools, Claude Function Calling) achieve 92-95% tool accuracy. Research systems target ≥90% as minimum viable performance.',
      measurementProtocol: 'Execute predefined scenarios requiring tool usage. Log tool selections, parameters, execution results. Calculate accuracy as (correct_calls / total_calls) × 100.',
      citations: 'Yao et al. (2023) - ReAct: Synergizing Reasoning and Acting in Language Models; Qin et al. (2023) - ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs',
    },
    reasoning: {
      researchContext: 'Reasoning evaluation draws from Chain-of-Thought (CoT) prompting research and logical reasoning benchmarks used in academic AI research (GSM8K, MMLU, BIG-Bench).',
      evaluationCriteria: 'Assesses logical coherence, step-by-step reasoning quality, conclusion validity, handling of edge cases, and ability to break down complex problems into manageable sub-problems.',
      scientificBasis: 'Grounded in cognitive science principles and validated against standardized reasoning benchmarks. CoT has shown 3-5x improvement in complex reasoning tasks.',
      acceptanceCriteria: 'Reasoning score ≥85%, logical consistency ≥90%, valid conclusions ≥95%. Poor reasoning leads to incorrect outputs despite correct tool usage.',
      industryBenchmarks: 'State-of-the-art models (GPT-4, Claude 3) score 85-92% on mathematical reasoning benchmarks. Production systems target ≥80% for domain-specific tasks.',
      measurementProtocol: 'Present reasoning challenges, analyze intermediate steps, verify logical validity. Score based on correctness of intermediate steps and final conclusions.',
      citations: 'Wei et al. (2022) - Chain-of-Thought Prompting Elicits Reasoning in Large Language Models; Kojima et al. (2023) - Large Language Models are Zero-Shot Reasoners',
    },
    collaborative: {
      researchContext: 'Multi-agent collaboration evaluation based on distributed AI research and swarm intelligence principles, adapted for LLM agent ecosystems.',
      evaluationCriteria: 'Measures communication efficiency, task delegation accuracy, information sharing completeness, conflict resolution, and overall system throughput in collaborative scenarios.',
      scientificBasis: 'Draws from AutoGen (Microsoft Research) multi-agent patterns and collaborative AI frameworks. Validates that agent systems can effectively distribute and coordinate work.',
      acceptanceCriteria: 'Collaboration efficiency ≥85%, message passing accuracy ≥90%, task completion speedup ≥1.5x compared to single-agent baseline.',
      industryBenchmarks: 'Multi-agent systems achieve 80-90% efficiency in production deployments. Academic research targets 2-3x speedup for parallelizable tasks.',
      measurementProtocol: 'Execute collaborative workflows, track inter-agent messages, measure task completion time. Compare against single-agent baseline for efficiency gains.',
      citations: 'Wu et al. (2023) - AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation; Park et al. (2023) - Generative Agents: Interactive Simulacra of Human Behavior',
    },
    performance: {
      researchContext: 'Performance evaluation uses established SLI/SLO metrics from production LLM systems, informed by latency and throughput research from major AI providers.',
      evaluationCriteria: 'Measures response latency (p50, p95, p99), throughput (requests/second), token generation speed, and resource utilization under various load conditions.',
      scientificBasis: 'Based on operational metrics from OpenAI, Anthropic, and Google production systems. Critical for user experience and cost efficiency at scale.',
      acceptanceCriteria: 'P95 latency <500ms, throughput ≥10 req/s, cost per request <$0.01 for typical workloads. Latency >1s leads to poor UX and user abandonment.',
      industryBenchmarks: 'Production APIs target p95 <500ms (OpenAI, Anthropic). Batch processing systems optimize for throughput over latency.',
      measurementProtocol: 'Execute load tests with varying concurrency. Measure end-to-end latency, calculate percentiles, monitor resource usage (CPU, memory, GPU utilization).',
      citations: 'OpenAI API Performance Guidelines (2024); Anthropic Claude Performance Benchmarks (2024); MLPerf LLM Inference Benchmarks',
    },
    security: {
      researchContext: 'Security evaluation based on OWASP Top 10 for LLM Applications and prompt injection research, addressing emerging threats in agentic AI systems.',
      evaluationCriteria: 'Tests resistance to prompt injection, data leakage prevention, unsafe tool execution prevention, jailbreak attempts, and adherence to safety guidelines.',
      scientificBasis: 'Grounded in adversarial ML research and red-teaming studies. Critical for preventing data breaches, unauthorized actions, and reputational damage.',
      acceptanceCriteria: 'Security score ≥95%, zero critical vulnerabilities, successful defense against ≥90% of known attack patterns.',
      industryBenchmarks: 'Enterprise LLM systems require ≥95% security scores. Financial and healthcare applications have stricter requirements (≥98%).',
      measurementProtocol: 'Execute adversarial test suite including prompt injections, jailbreak attempts, data extraction attacks. Log all bypass attempts and successful defenses.',
      citations: 'OWASP Top 10 for LLM Applications (2024); Perez & Ribeiro (2022) - Ignore Previous Prompt: Attack Techniques For Language Models; Greshake et al. (2023) - Not what you\'ve signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection',
    },
  };

  const guideline = guidelines[category] || guidelines['tool_calling']; // Fallback to tool_calling

  return {
    testId: testCase.id,
    testName: testCase.name || 'Unknown Test',
    category,
    ...guideline,
  };
}
