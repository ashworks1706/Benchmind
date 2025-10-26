/**
 * Cost Calculator for AI Agents
 * Estimates costs based on model usage, token counts, and API calls
 */

// Cost per 1M tokens for different models (approximate)
const MODEL_COSTS = {
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-flash': { input: 0.075, output: 0.3 },
};

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  model: string;
  apiCalls: number;
  latency_ms?: number;      // Average latency in milliseconds
  reliability?: number;     // Success rate (0-1)
}

export interface CostMultipliers {
  reasoning: number;      // 0.5 - 1.5 (affects token usage)
  accuracy: number;       // 0.5 - 1.5 (affects API calls)
  costOptimization: number; // 0.5 - 1.5 (affects overall cost)
  speed: number;          // 0.5 - 1.5 (affects calls per day and latency)
}

// Model latencies (average response time in milliseconds)
const MODEL_LATENCIES = {
  'gpt-4': 2500,
  'gpt-4-turbo': 1800,
  'gpt-3.5-turbo': 800,
  'claude-3-opus': 2200,
  'claude-3-sonnet': 1500,
  'gemini-pro': 1200,
  'gemini-flash': 600,
};

/**
 * Estimate tokens from text length
 */
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for agent operations
 */
export function calculateAgentCost(
  agent: any,
  avgInputTokens = 500,
  avgOutputTokens = 200,
  callsPerDay = 10,
  multipliers?: CostMultipliers
): CostEstimate {
  // Determine model from agent config or use default
  const model = agent.model || agent.config?.model || agent.model_config?.model || 'gemini-flash';
  const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS['gemini-flash'];
  
  // Estimate based on code length if available
  const codeTokens = agent.code ? estimateTokens(agent.code) : 0;
  const promptTokens = agent.system_prompt || agent.system_instruction ? estimateTokens(agent.system_prompt || agent.system_instruction) : 0;
  
  // Apply reasoning multiplier to token usage (more reasoning = more tokens)
  const reasoningMultiplier = multipliers?.reasoning ?? 1.0;
  const accuracyMultiplier = multipliers?.accuracy ?? 1.0;
  const costMultiplier = multipliers?.costOptimization ?? 1.0;
  const speedMultiplier = multipliers?.speed ?? 1.0;
  
  const inputTokens = (avgInputTokens + promptTokens) * reasoningMultiplier;
  const outputTokens = avgOutputTokens * reasoningMultiplier;
  
  // Cost per call
  const costPerCall = (
    (inputTokens * modelCost.input / 1_000_000) +
    (outputTokens * modelCost.output / 1_000_000)
  );
  
  // Apply multipliers: accuracy affects call frequency, speed affects daily calls, cost optimization reduces overall cost
  const adjustedCallsPerDay = callsPerDay * accuracyMultiplier * speedMultiplier;
  const totalCost = costPerCall * adjustedCallsPerDay / costMultiplier;
  
  // Calculate latency: base model latency adjusted by reasoning (more reasoning = slower) and speed multiplier
  const baseLatency = MODEL_LATENCIES[model as keyof typeof MODEL_LATENCIES] || MODEL_LATENCIES['gemini-flash'];
  const latency_ms = Math.round(baseLatency * reasoningMultiplier / speedMultiplier);
  
  // Get reliability from agent metrics or use default
  const reliability = agent.metrics?.reliability ?? 0.95;
  
  return {
    inputTokens: Math.round(inputTokens),
    outputTokens: Math.round(outputTokens),
    totalCost,
    model,
    apiCalls: Math.round(adjustedCallsPerDay),
    latency_ms,
    reliability,
  };
}

/**
 * Calculate cost for tool execution
 */
export function calculateToolCost(
  tool: any,
  callsPerDay = 5,
  multipliers?: CostMultipliers
): CostEstimate {
  // Tools typically don't have LLM costs, just execution overhead
  // Estimate based on complexity from code length
  const codeTokens = tool.code ? estimateTokens(tool.code) : 100;
  
  // Apply multipliers
  const accuracyMultiplier = multipliers?.accuracy ?? 1.0;
  const costMultiplier = multipliers?.costOptimization ?? 1.0;
  const speedMultiplier = multipliers?.speed ?? 1.0;
  
  // Base execution cost (in dollars per call)
  const executionCost = 0.0001; // Very small per-execution cost
  
  // Apply multipliers: accuracy affects call frequency, speed affects daily calls, cost optimization reduces overall cost
  const adjustedCallsPerDay = callsPerDay * accuracyMultiplier * speedMultiplier;
  const totalCost = executionCost * adjustedCallsPerDay / costMultiplier;
  
  // Calculate latency: based on code complexity and speed multiplier
  const complexityFactor = Math.min(codeTokens / 100, 10); // Scale by code size
  const baseLatency = 50 + (complexityFactor * 20); // 50-250ms base range
  const latency_ms = Math.round((tool.metrics?.latency_ms ?? baseLatency) / speedMultiplier);
  
  // Get reliability from tool metrics or use default
  const reliability = tool.metrics?.reliability ?? 0.98;
  
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalCost,
    model: 'N/A',
    apiCalls: Math.round(adjustedCallsPerDay),
    latency_ms,
    reliability,
  };
}

/**
 * Calculate cost for relationship/connection
 */
export function calculateConnectionCost(
  relationship: any,
  callsPerDay = 10,
  multipliers?: CostMultipliers
): CostEstimate {
  // Connection costs = data transfer + coordination overhead
  const dataTokens = relationship?.data_flow ? estimateTokens(relationship.data_flow) : 50;
  
  // Apply multipliers
  const accuracyMultiplier = multipliers?.accuracy ?? 1.0;
  const costMultiplier = multipliers?.costOptimization ?? 1.0;
  const speedMultiplier = multipliers?.speed ?? 1.0;
  
  // Small cost per connection (data serialization, transfer, etc.)
  const costPerCall = 0.00005; // $0.00005 per connection
  
  // Apply multipliers: accuracy affects call frequency, speed affects daily calls, cost optimization reduces overall cost
  const adjustedCallsPerDay = callsPerDay * accuracyMultiplier * speedMultiplier;
  const totalCost = costPerCall * adjustedCallsPerDay / costMultiplier;
  
  // Calculate latency: network latency + serialization overhead
  const dataVolume = relationship?.metrics?.data_volume ?? 10; // KB
  const baseNetworkLatency = 20; // 20ms base network latency
  const serializationLatency = dataVolume * 0.5; // 0.5ms per KB
  const baseLatency = baseNetworkLatency + serializationLatency;
  const latency_ms = Math.round((relationship?.metrics?.latency_ms ?? baseLatency) / speedMultiplier);
  
  // Get reliability from relationship metrics or use default
  const reliability = relationship?.metrics?.reliability ?? 0.99;
  
  return {
    inputTokens: dataTokens,
    outputTokens: 0,
    totalCost,
    model: 'connection',
    apiCalls: Math.round(adjustedCallsPerDay),
    latency_ms,
    reliability,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}m`; // Show in millidollars
  } else if (cost < 1) {
    return `$${(cost * 100).toFixed(1)}¢`; // Show in cents
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Format latency for display
 */
export function formatLatency(latency_ms: number): string {
  if (latency_ms < 1000) {
    return `${latency_ms}ms`;
  } else if (latency_ms < 60000) {
    return `${(latency_ms / 1000).toFixed(2)}s`;
  } else {
    return `${(latency_ms / 60000).toFixed(2)}m`;
  }
}

/**
 * Get latency tier color
 */
export function getLatencyColor(latency_ms: number): string {
  if (latency_ms < 100) return 'text-green-600 dark:text-green-400';
  if (latency_ms < 500) return 'text-blue-600 dark:text-blue-400';
  if (latency_ms < 1000) return 'text-yellow-600 dark:text-yellow-400';
  if (latency_ms < 3000) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Format reliability as percentage
 */
export function formatReliability(reliability: number): string {
  return `${(reliability * 100).toFixed(1)}%`;
}

/**
 * Get reliability tier color
 */
export function getReliabilityColor(reliability: number): string {
  if (reliability >= 0.99) return 'text-green-600 dark:text-green-400';
  if (reliability >= 0.95) return 'text-blue-600 dark:text-blue-400';
  if (reliability >= 0.90) return 'text-yellow-600 dark:text-yellow-400';
  if (reliability >= 0.80) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get cost tier color
 */
export function getCostColor(cost: number): string {
  if (cost < 0.01) return 'text-green-600 dark:text-green-400';
  if (cost < 0.1) return 'text-yellow-600 dark:text-yellow-400';
  if (cost < 1) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Calculate total system cost
 */
export function calculateSystemCost(agentData: any): {
  agents: CostEstimate[];
  tools: CostEstimate[];
  connections: CostEstimate[];
  totalDaily: number;
  totalMonthly: number;
  totalLatency: number;  // Total end-to-end latency in ms
  avgReliability: number; // Average reliability across all components
} {
  const agents = (agentData?.agents || []).map((a: any) => calculateAgentCost(a));
  const tools = (agentData?.tools || []).map((t: any) => calculateToolCost(t));
  const connections = (agentData?.relationships || []).map((r: any) => calculateConnectionCost(r));
  
  const totalDaily = [
    ...agents,
    ...tools,
    ...connections,
  ].reduce((sum, item) => sum + item.totalCost, 0);
  
  // Calculate total latency (sum of all components for worst-case serial execution)
  const totalLatency = [
    ...agents,
    ...tools,
    ...connections,
  ].reduce((sum, item) => sum + (item.latency_ms || 0), 0);
  
  // Calculate average reliability (product of all reliabilities for serial execution)
  const allComponents = [...agents, ...tools, ...connections];
  const reliabilityProduct = allComponents.reduce((product, item) => 
    product * (item.reliability || 1), 1
  );
  const avgReliability = allComponents.length > 0 ? reliabilityProduct : 1;
  
  return {
    agents,
    tools,
    connections,
    totalDaily,
    totalMonthly: totalDaily * 30,
    totalLatency,
    avgReliability,
  };
}
