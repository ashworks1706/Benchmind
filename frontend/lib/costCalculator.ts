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
}

export interface CostMultipliers {
  reasoning: number;      // 0.5 - 1.5 (affects token usage)
  accuracy: number;       // 0.5 - 1.5 (affects API calls)
  costOptimization: number; // 0.5 - 1.5 (affects overall cost)
  speed: number;          // 0.5 - 1.5 (affects calls per day)
}

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
  const model = agent.model || agent.config?.model || 'gemini-flash';
  const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS['gemini-flash'];
  
  // Estimate based on code length if available
  const codeTokens = agent.code ? estimateTokens(agent.code) : 0;
  const promptTokens = agent.system_prompt ? estimateTokens(agent.system_prompt) : 0;
  
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
  
  return {
    inputTokens: Math.round(inputTokens),
    outputTokens: Math.round(outputTokens),
    totalCost,
    model,
    apiCalls: Math.round(adjustedCallsPerDay),
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
  
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalCost,
    model: 'N/A',
    apiCalls: Math.round(adjustedCallsPerDay),
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
  const dataTokens = relationship.data_flow ? estimateTokens(relationship.data_flow) : 50;
  
  // Apply multipliers
  const accuracyMultiplier = multipliers?.accuracy ?? 1.0;
  const costMultiplier = multipliers?.costOptimization ?? 1.0;
  const speedMultiplier = multipliers?.speed ?? 1.0;
  
  // Small cost per connection (data serialization, transfer, etc.)
  const costPerCall = 0.00005; // $0.00005 per connection
  
  // Apply multipliers: accuracy affects call frequency, speed affects daily calls, cost optimization reduces overall cost
  const adjustedCallsPerDay = callsPerDay * accuracyMultiplier * speedMultiplier;
  const totalCost = costPerCall * adjustedCallsPerDay / costMultiplier;
  
  return {
    inputTokens: dataTokens,
    outputTokens: 0,
    totalCost,
    model: 'connection',
    apiCalls: Math.round(adjustedCallsPerDay),
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
} {
  const agents = (agentData?.agents || []).map((a: any) => calculateAgentCost(a));
  const tools = (agentData?.tools || []).map((t: any) => calculateToolCost(t));
  const connections = (agentData?.relationships || []).map((r: any) => calculateConnectionCost(r));
  
  const totalDaily = [
    ...agents,
    ...tools,
    ...connections,
  ].reduce((sum, item) => sum + item.totalCost, 0);
  
  return {
    agents,
    tools,
    connections,
    totalDaily,
    totalMonthly: totalDaily * 30,
  };
}
