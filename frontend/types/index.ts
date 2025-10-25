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
}

export interface Relationship {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  type: 'calls' | 'collaborates' | 'sequential' | 'parallel';
  description: string;
  data_flow: string;
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
export interface TestCase {
  id: string;
  name: string;
  category: 
    | 'hyperparameter'
    | 'prompt_injection'
    | 'tool_calling'
    | 'relationship'
    | 'collaborative'
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
}

export interface TestResult {
  test_id: string;
  status: 'passed' | 'failed' | 'warning' | 'error';
  execution_time: number;
  results: {
    summary: string;
    details: string;
    issues_found: string[];
    metrics: {
      accuracy?: number;
      performance?: string;
      security_score?: number;
    };
  };
  recommendations: Fix[];
}

export interface Fix {
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  fix: {
    file_path: string;
    line_number: number;
    current_code: string;
    suggested_code: string;
    explanation: string;
  };
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

export type PanelView = 'status' | 'details' | 'both';
export type SelectedElement = {
  type: 'agent' | 'tool' | 'relationship';
  data: Agent | Tool | Relationship;
} | null;
