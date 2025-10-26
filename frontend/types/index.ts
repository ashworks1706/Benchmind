// Types for Agent Data
export interface Agent {
  id: string;
  name: string;
  type: string;
  file_path: string;
  prompt: string;
  system_instruction: string;
  model_config: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
  tools: string[];
  hyperparameters: Record<string, any>;
  objective: string;
  code_snippet: string;
  // Enhanced metrics for data analysis
  metrics?: {
    reasoning_score?: number;     // Reasoning capability (0-100)
    accuracy?: number;            // Response accuracy (0-1)
    latency_ms?: number;          // Average response latency in milliseconds
    token_efficiency?: number;    // Tokens used per task (lower is better)
    reliability?: number;         // Success rate (0-1)
    context_retention?: number;   // Ability to maintain context (0-1)
    creativity?: number;          // Response diversity (0-1)
    impact?: 'low' | 'medium' | 'high' | 'critical'; // Business impact
  };
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  file_path: string;
  parameters: {
    name: string;
    type: string;
    description: string;
  }[];
  return_type: string;
  code: string;
  summary: string;
  // Enhanced metrics for data analysis
  metrics?: {
    latency_ms?: number;          // Average execution latency in milliseconds
    reliability?: number;         // Success rate (0-1)
    complexity?: 'low' | 'medium' | 'high'; // Code complexity
    error_rate?: number;          // Error rate (0-1)
    cache_hit_rate?: number;      // Cache effectiveness (0-1)
    impact?: 'low' | 'medium' | 'high' | 'critical'; // Business impact
  };
}

export interface Relationship {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  type: 'calls' | 'collaborates' | 'sequential' | 'parallel';
  description: string;
  data_flow: string;
  // Enhanced metrics for data analysis
  metrics?: {
    latency_ms?: number;          // Connection latency in milliseconds
    bandwidth?: number;           // Data transfer rate (KB/s)
    reliability?: number;         // Connection success rate (0-1)
    data_volume?: number;         // Average data size per call (KB)
    frequency?: number;           // Calls per minute
    error_rate?: number;          // Connection error rate (0-1)
    timeout_rate?: number;        // Timeout occurrence rate (0-1)
    impact?: 'low' | 'medium' | 'high' | 'critical'; // Business impact
  };
}

export interface AgentData {
  agents: Agent[];
  tools: Tool[];
  relationships: Relationship[];
  repository: {
    owner: string;
    repo_name: string;
    description: string;
  };
}

// Types for Test Cases
export interface TestMetric {
  name: string;
  unit: string;
  benchmark: number;
  description: string;
  value?: number;
  passed?: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  category: 
    | 'hyperparameter'
    | 'prompt_injection'
    | 'tool_calling'
    | 'reasoning'
    | 'relationship'
    | 'collaborative'
    | 'connection'
    | 'error_handling'
    | 'output_quality'
    | 'performance'
    | 'edge_case'
    | 'security';
  description: string;
  target: {
    type: 'agent' | 'tool' | 'relationship';
    id: string;
    name: string;
  };
  test_input: string;
  expected_behavior: string;
  success_criteria: string;
  highlight_elements: string[];
  metrics?: TestMetric[];
  estimated_duration?: number;
}

export interface TestResult {
  test_id: string;
  status: 'passed' | 'failed' | 'warning' | 'error';
  execution_time: number;
  results: {
    summary: string;
    details: string;
    issues_found: string[];
    logs?: string[];
  };
  metrics?: TestMetric[];
  recommendations: Fix[];
}

export interface Fix {
  id: string; // Add unique ID for tracking
  severity: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  issue: string;
  impact?: string;
  fix: {
    file_path: string;
    line_number: number;
    current_code: string;
    suggested_code: string;
    explanation: string;
  };
  status?: 'pending' | 'accepted' | 'rejected'; // Track user decision
  decidedAt?: string; // Timestamp of decision
}

// Types for UI State
export interface CanvasNode {
  id: string;
  type: 'agent' | 'tool';
  position: { x: number; y: number };
  data: Agent | Tool;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: 'tool' | 'relationship';
  data?: Relationship;
}

export interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
  timestamp: Date;
}

export type PanelView = 'status' | 'details' | 'both' | 'testing' | 'testing-report';
export type SelectedElement = {
  type: 'agent' | 'tool' | 'relationship' | 'edge' | 'test';
  data: Agent | Tool | Relationship | TestCase | any;
} | null;
