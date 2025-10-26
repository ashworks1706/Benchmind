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
  // Research-grade quantifiable metrics
  metrics?: {
    // Response Quality (0-100 scale)
    hallucination_rate?: number;        // % of responses with factual errors (0-100)
    coherence_score?: number;           // Logical consistency score (0-100)
    context_window_usage?: number;      // % of context window utilized (0-100)
    
    // Performance Benchmarks
    p50_latency_ms?: number;            // Median response time in milliseconds
    p95_latency_ms?: number;            // 95th percentile latency (for tail performance)
    p99_latency_ms?: number;            // 99th percentile latency (worst case)
    tokens_per_second?: number;         // Token generation throughput
    
    // Reliability Metrics (measured over 1000 calls)
    success_rate?: number;              // % of successful completions (0-100)
    timeout_rate?: number;              // % of requests that timeout (0-100)
    rate_limit_hits?: number;           // Count of rate limit errors per 1000 calls
    
    // Quality Assurance
    answer_relevance_score?: number;    // Relevance to prompt (0-100, RAGAS metric)
    faithfulness_score?: number;        // Groundedness in context (0-100, RAGAS metric)
    context_recall?: number;            // % of relevant context used (0-100)
    
    // Cost Efficiency
    cost_per_task_usd?: number;         // Average $ cost per completed task
    tokens_per_task?: number;           // Average tokens consumed per task
    
    // Business Criticality
    user_dependency?: 'none' | 'low' | 'medium' | 'high' | 'critical';
    failure_blast_radius?: 'isolated' | 'local' | 'regional' | 'global';
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
  // Research-grade quantifiable metrics
  metrics?: {
    // Execution Performance (measured values)
    p50_execution_ms?: number;          // Median execution time in milliseconds
    p95_execution_ms?: number;          // 95th percentile execution time
    p99_execution_ms?: number;          // 99th percentile execution time
    max_execution_ms?: number;          // Maximum observed execution time
    
    // Reliability Metrics (over 1000 executions)
    success_rate?: number;              // % of successful executions (0-100)
    exception_rate?: number;            // % of executions throwing exceptions (0-100)
    timeout_rate?: number;              // % of executions exceeding timeout (0-100)
    retry_rate?: number;                // % of executions requiring retry (0-100)
    
    // Resource Utilization
    avg_memory_mb?: number;             // Average memory consumption in MB
    peak_memory_mb?: number;            // Peak memory consumption in MB
    cpu_utilization_pct?: number;       // Average CPU utilization % (0-100)
    
    // Data Quality
    output_validation_pass_rate?: number; // % of outputs passing validation (0-100)
    schema_compliance_rate?: number;    // % of outputs matching schema (0-100)
    null_return_rate?: number;          // % of executions returning null (0-100)
    
    // Caching & Efficiency
    cache_hit_rate?: number;            // % of requests served from cache (0-100)
    cache_write_rate?: number;          // % of results cached (0-100)
    deduplication_rate?: number;        // % of duplicate calls avoided (0-100)
    
    // Code Complexity (static analysis)
    cyclomatic_complexity?: number;     // McCabe complexity score
    lines_of_code?: number;             // Total lines of code
    test_coverage_pct?: number;         // Unit test coverage % (0-100)
    
    // Business Impact
    calls_per_day?: number;             // Average number of invocations per day
    user_dependency?: 'none' | 'low' | 'medium' | 'high' | 'critical';
    data_sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
  };
}

export interface Relationship {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  type: 'calls' | 'collaborates' | 'sequential' | 'parallel';
  description: string;
  data_flow: string;
  // Research-grade quantifiable metrics
  metrics?: {
    // Network Performance (measured latency breakdown)
    p50_total_latency_ms?: number;      // Median end-to-end latency
    p95_total_latency_ms?: number;      // 95th percentile latency
    p99_total_latency_ms?: number;      // 99th percentile latency
    dns_lookup_ms?: number;             // DNS resolution time
    tcp_handshake_ms?: number;          // TCP connection time
    tls_handshake_ms?: number;          // TLS negotiation time
    serialization_ms?: number;          // Data serialization time
    deserialization_ms?: number;        // Data deserialization time
    network_transfer_ms?: number;       // Actual data transfer time
    
    // Connection Reliability (over 1000 calls)
    success_rate?: number;              // % of successful connections (0-100)
    connection_error_rate?: number;     // % of connection failures (0-100)
    timeout_rate?: number;              // % of timeouts (0-100)
    circuit_breaker_trips?: number;     // Count of circuit breaker activations
    
    // Data Transfer Metrics
    avg_payload_bytes?: number;         // Average message size in bytes
    p95_payload_bytes?: number;         // 95th percentile payload size
    max_payload_bytes?: number;         // Maximum observed payload size
    throughput_mbps?: number;           // Megabits per second throughput
    
    // Traffic Patterns
    requests_per_minute?: number;       // Average request frequency
    peak_requests_per_minute?: number;  // Peak request rate
    burst_factor?: number;              // Peak/average ratio (burstiness)
    
    // Data Quality
    message_validation_pass_rate?: number; // % passing schema validation (0-100)
    data_corruption_rate?: number;      // % of corrupted messages (0-100)
    message_loss_rate?: number;         // % of lost messages (0-100)
    
    // Backpressure & Flow Control
    queue_depth_p50?: number;           // Median queue size
    queue_depth_p95?: number;           // 95th percentile queue size
    backpressure_events?: number;       // Count of backpressure activations
    dropped_messages?: number;          // Count of dropped messages
    
    // Business Criticality
    user_facing?: boolean;              // Is this connection user-facing?
    sla_target_ms?: number;             // SLA latency target in ms
    sla_compliance_rate?: number;       // % of calls meeting SLA (0-100)
    user_dependency?: 'none' | 'low' | 'medium' | 'high' | 'critical';
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
