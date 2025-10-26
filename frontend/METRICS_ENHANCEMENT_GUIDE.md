# Enhanced Metrics System Guide

## Overview
This system provides comprehensive metrics tracking for agents, tools, and relationships, including latency, reliability, and various performance indicators.

## New Features

### 1. **Agent Metrics**
Agents now support the following enhanced metrics:

```typescript
interface Agent {
  metrics?: {
    reasoning_score?: number;     // Reasoning capability (0-100)
    accuracy?: number;            // Response accuracy (0-1)
    latency_ms?: number;          // Average response latency
    token_efficiency?: number;    // Tokens used per task
    reliability?: number;         // Success rate (0-1)
    context_retention?: number;   // Context maintenance (0-1)
    creativity?: number;          // Response diversity (0-1)
    impact?: 'low' | 'medium' | 'high' | 'critical';
  };
}
```

**Example Usage:**
```json
{
  "id": "agent-1",
  "name": "Research Agent",
  "metrics": {
    "reasoning_score": 85,
    "accuracy": 0.92,
    "latency_ms": 1200,
    "token_efficiency": 450,
    "reliability": 0.95,
    "context_retention": 0.88,
    "creativity": 0.75,
    "impact": "high"
  }
}
```

### 2. **Tool Metrics**
Tools now track execution performance:

```typescript
interface Tool {
  metrics?: {
    latency_ms?: number;          // Execution latency
    reliability?: number;         // Success rate (0-1)
    complexity?: 'low' | 'medium' | 'high';
    error_rate?: number;          // Error rate (0-1)
    cache_hit_rate?: number;      // Cache effectiveness (0-1)
    impact?: 'low' | 'medium' | 'high' | 'critical';
  };
}
```

**Example Usage:**
```json
{
  "id": "tool-1",
  "name": "Database Query Tool",
  "metrics": {
    "latency_ms": 45,
    "reliability": 0.98,
    "complexity": "medium",
    "error_rate": 0.02,
    "cache_hit_rate": 0.85,
    "impact": "critical"
  }
}
```

### 3. **Relationship Metrics**
Connections between agents track data flow performance:

```typescript
interface Relationship {
  metrics?: {
    latency_ms?: number;          // Connection latency
    bandwidth?: number;           // Data transfer rate (KB/s)
    reliability?: number;         // Connection success rate (0-1)
    data_volume?: number;         // Avg data size per call (KB)
    frequency?: number;           // Calls per minute
    error_rate?: number;          // Connection error rate (0-1)
    timeout_rate?: number;        // Timeout occurrence rate (0-1)
    impact?: 'low' | 'medium' | 'high' | 'critical';
  };
}
```

**Example Usage:**
```json
{
  "id": "rel-1",
  "from_agent_id": "agent-1",
  "to_agent_id": "agent-2",
  "type": "calls",
  "metrics": {
    "latency_ms": 25,
    "bandwidth": 150,
    "reliability": 0.99,
    "data_volume": 10,
    "frequency": 30,
    "error_rate": 0.01,
    "timeout_rate": 0.005,
    "impact": "high"
  }
}
```

## Canvas Display

### Total Canvas Metrics
The canvas now shows three key metrics at the top-right:

1. **Total Canvas Cost** - Sum of all visible component costs
2. **Total Latency** - Cumulative latency of all visible components
3. **Avg Reliability** - Product of all component reliabilities

These metrics are **reactive** to:
- Objective focus slider changes
- Hiding/showing nodes
- Any cost multiplier adjustments

### Metric Colors
- **Green**: Excellent performance
- **Blue**: Good performance  
- **Yellow**: Acceptable but watch
- **Orange**: Needs attention
- **Red**: Critical issues

## Details Panel Enhancements

### Agent Details
Now shows:
- **Cost Analysis**: Daily/monthly costs, API calls, token usage
- **Performance Metrics**: Latency, reliability, reasoning score, accuracy, token efficiency, context retention, creativity, business impact

### Tool Details  
Now shows:
- **Cost Analysis**: Daily/monthly costs, execution frequency
- **Performance Metrics**: Latency, reliability, error rate, complexity, cache hit rate, business impact

### Relationship Details
Now shows:
- **Cost Analysis**: Daily/monthly costs, API calls, data tokens
- **Performance Metrics**: Connection latency, reliability, bandwidth, data volume, call frequency, error rate, timeout rate, business impact

## Helper Functions

### Formatting Functions
```typescript
formatCost(cost: number): string       // "$1.23" or "$4.5¢" or "$12.3m"
formatLatency(ms: number): string      // "120ms" or "1.5s" or "2.3m"
formatReliability(rate: number): string // "99.5%"
```

### Color Functions
```typescript
getCostColor(cost: number): string
getLatencyColor(ms: number): string
getReliabilityColor(rate: number): string
```

## Cost Calculation with Latency

All cost calculations now return extended information:

```typescript
interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  model: string;
  apiCalls: number;
  latency_ms?: number;      // NEW
  reliability?: number;     // NEW
}
```

### Latency Calculations

**Agents**: Base model latency × reasoning multiplier ÷ speed multiplier
- GPT-4: 2500ms base
- GPT-4 Turbo: 1800ms
- Claude Sonnet: 1500ms
- Gemini Flash: 600ms

**Tools**: 50-250ms based on code complexity ÷ speed multiplier

**Connections**: Network latency (20ms) + serialization (0.5ms/KB) ÷ speed multiplier

## Objective Focus Impact

The objective focus sliders affect:
- **Reasoning** (0.5-1.5×): Token usage, latency
- **Accuracy** (0.5-1.5×): API calls, frequency
- **Cost Optimization** (0.5-1.5×): Overall cost reduction
- **Speed** (0.5-1.5×): Latency reduction, call frequency

## Example: Complete System

```json
{
  "agents": [
    {
      "id": "research-agent",
      "name": "Research Agent",
      "model_config": { "model": "gpt-4-turbo" },
      "metrics": {
        "reasoning_score": 90,
        "accuracy": 0.94,
        "latency_ms": 1800,
        "reliability": 0.96,
        "impact": "critical"
      }
    }
  ],
  "tools": [
    {
      "id": "search-tool",
      "name": "Web Search",
      "metrics": {
        "latency_ms": 80,
        "reliability": 0.99,
        "complexity": "low",
        "error_rate": 0.01,
        "impact": "high"
      }
    }
  ],
  "relationships": [
    {
      "id": "rel-1",
      "from_agent_id": "research-agent",
      "to_agent_id": "writer-agent",
      "type": "sequential",
      "metrics": {
        "latency_ms": 30,
        "bandwidth": 200,
        "reliability": 0.99,
        "data_volume": 15,
        "impact": "medium"
      }
    }
  ]
}
```

## Best Practices

1. **Always provide metrics** when available from monitoring
2. **Use realistic latency values** based on actual measurements
3. **Track reliability** over time to identify degradation
4. **Set appropriate impact levels** for business-critical components
5. **Monitor total canvas latency** to ensure acceptable user experience
6. **Use cache metrics** to optimize tool performance

## Scrolling in Details Panel

The details panel is now fully scrollable with `ScrollArea` component, allowing you to view all metrics even for complex systems with many data points.

## Future Enhancements

Potential additions:
- Historical metric tracking
- Anomaly detection
- Performance regression alerts
- Cost optimization suggestions
- SLA compliance monitoring
