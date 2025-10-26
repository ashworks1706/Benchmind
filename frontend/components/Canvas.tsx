'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Agent, Tool, TestCase, Relationship } from '@/types';
import { getTestCaseColor } from '@/lib/testColors';
import { calculateAgentCost, calculateToolCost, calculateConnectionCost, formatCost, getCostColor, formatLatency, getLatencyColor, formatSuccessRate, getSuccessRateColor, CostMultipliers } from '@/lib/costCalculator';
import { SessionSelector } from './SessionSelector';
import { ResearchReportModal } from './ResearchReportModal';
import { ObjectiveFocusPanel } from './ObjectiveFocusPanel';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

interface CanvasNode {
  id: string;
  type: 'agent' | 'tool' | 'test';
  x: number;
  y: number;
  width: number;
  height: number;
  data: Agent | Tool | (Tool & { parentAgentId?: string }) | TestCase;
}

interface CanvasEdge {
  id: string;
  type: 'agent-tool' | 'agent-agent' | 'test-target';
  from: CanvasNode;
  to: CanvasNode;
  data?: Relationship;
  color?: string;
}

export function Canvas() {
  const { 
    agentData, 
    isLoading, 
    loadingMessage, 
    isGeneratingTests, 
    highlightedElements, 
    errorHighlightedElements, 
    warningHighlightedElements, 
    setSelectedElement, 
    setPanelView, 
    testCases, 
    pendingTestCases, 
    testResults, 
    currentTestIndex, 
    isTestingInProgress, 
    currentRunningTestId,
    testCollections,
    visibleSessionIds,
    showProgressReport,
    currentProgressSessionId,
    setShowProgressReport,
    acceptFix,
    rejectFix,
    objectiveFocus,
  } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<CanvasNode | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });
  const [showAgents, setShowAgents] = useState(true);
  const [showTools, setShowTools] = useState(true);
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());
  const [fadingOutNodeIds, setFadingOutNodeIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Calculate cost multipliers from objective focus sliders
  const costMultipliers: CostMultipliers = useMemo(() => {
    const reasoningFactor = 1 + (objectiveFocus.reasoning - 50) / 100; // 0.5 to 1.5
    const accuracyFactor = 1 + (objectiveFocus.accuracy - 50) / 100;   // 0.5 to 1.5
    const costFactor = 1 - (objectiveFocus.costOptimization - 50) / 100; // 1.5 to 0.5 (inverted)
    const speedFactor = 1 - (objectiveFocus.speed - 50) / 100;          // 1.5 to 0.5 (inverted)
    
    return {
      reasoning: reasoningFactor,
      accuracy: accuracyFactor,
      costOptimization: costFactor,
      speed: speedFactor,
    };
  }, [objectiveFocus]);

  // Calculate visual effects based on objective focus
  const visualEffects = useMemo(() => {
    // More reasoning = larger nodes (more complex processing)
    const sizeScale = 0.85 + (objectiveFocus.reasoning / 200); // 0.85 to 1.35
    
    // More accuracy = brighter, more saturated colors
    const colorIntensity = 0.6 + (objectiveFocus.accuracy / 250); // 0.6 to 1.0
    
    // More cost optimization = slightly transparent (lighter weight)
    const opacity = 1.0 - (objectiveFocus.costOptimization / 500); // 0.8 to 1.0
    
    // More speed = animation speed (reduced range for subtlety)
    const animationDuration = 1.2 - (objectiveFocus.speed / 200); // 0.7s to 1.2s
    
    return {
      sizeScale,
      colorIntensity,
      opacity,
      animationDuration,
    };
  }, [objectiveFocus]);

  // Calculate dynamic costs for all nodes, filtering out hidden ones
  const dynamicCosts = useMemo(() => {
    const costs = new Map<string, { 
      totalCost: number; 
      apiCalls: number; 
      p50_latency_ms?: number;
      p95_latency_ms?: number;
      p99_latency_ms?: number;
      success_rate?: number;
    }>();
    
    // Calculate costs for visible nodes only
    nodes.forEach(node => {
      if (hiddenNodeIds.has(node.id)) return;
      
      if (node.type === 'agent') {
        const cost = calculateAgentCost(node.data as Agent, 500, 200, 10, costMultipliers);
        costs.set(node.id, { 
          totalCost: cost.totalCost, 
          apiCalls: cost.apiCalls,
          p50_latency_ms: cost.p50_latency_ms,
          p95_latency_ms: cost.p95_latency_ms,
          p99_latency_ms: cost.p99_latency_ms,
          success_rate: cost.success_rate
        });
      } else if (node.type === 'tool') {
        const cost = calculateToolCost(node.data as Tool, 5, costMultipliers);
        costs.set(node.id, { 
          totalCost: cost.totalCost, 
          apiCalls: cost.apiCalls,
          p50_latency_ms: cost.p50_latency_ms,
          p95_latency_ms: cost.p95_latency_ms,
          p99_latency_ms: cost.p99_latency_ms,
          success_rate: cost.success_rate
        });
      }
    });
    
    // Calculate costs for visible edges
    edges.forEach(edge => {
      // Skip if either end is hidden
      if (hiddenNodeIds.has(edge.from.id) || hiddenNodeIds.has(edge.to.id)) return;
      
      // Only calculate cost if edge has data (relationships), otherwise use default cost with multipliers
      if (edge.data) {
        const cost = calculateConnectionCost(edge.data, 10, costMultipliers);
        costs.set(edge.id, { 
          totalCost: cost.totalCost, 
          apiCalls: cost.apiCalls,
          p50_latency_ms: cost.p50_latency_ms,
          p95_latency_ms: cost.p95_latency_ms,
          p99_latency_ms: cost.p99_latency_ms,
          success_rate: cost.success_rate
        });
      } else {
        // Default cost for edges without relationship data (e.g., agent-tool connections)
        // Apply multipliers to default cost as well
        const accuracyMultiplier = costMultipliers.accuracy ?? 1.0;
        const costOptimizationMultiplier = costMultipliers.costOptimization ?? 1.0;
        const speedMultiplier = costMultipliers.speed ?? 1.0;
        
        const baseCost = 0.00005;
        const baseCallsPerDay = 10;
        const baseP50 = 25; // 25ms P50 for agent-tool connection
        const adjustedCallsPerDay = baseCallsPerDay * accuracyMultiplier * speedMultiplier;
        const totalCost = baseCost * adjustedCallsPerDay / costOptimizationMultiplier;
        const p50_latency_ms = Math.round(baseP50 / speedMultiplier);
        const p95_latency_ms = Math.round((baseP50 * 2) / speedMultiplier);
        const p99_latency_ms = Math.round((baseP50 * 3) / speedMultiplier);
        
        costs.set(edge.id, { 
          totalCost, 
          apiCalls: Math.round(adjustedCallsPerDay),
          p50_latency_ms,
          p95_latency_ms,
          p99_latency_ms,
          success_rate: 99.5 // 99.5% for simple agent-tool connections
        });
      }
    });
    
    // Calculate total canvas metrics (P50 latency and success rate)
    let totalCanvasCost = 0;
    let totalP50Latency = 0;
    let totalP95Latency = 0;
    let totalP99Latency = 0;
    let successRateProduct = 1.0;
    let componentCount = 0;
    
    costs.forEach(cost => {
      totalCanvasCost += cost.totalCost;
      totalP50Latency += cost.p50_latency_ms || 0;
      totalP95Latency += cost.p95_latency_ms || 0;
      totalP99Latency += cost.p99_latency_ms || 0;
      successRateProduct *= (cost.success_rate || 100) / 100;
      componentCount++;
    });
    
    return { 
      costs, 
      totalCanvasCost, 
      totalP50Latency,
      totalP95Latency,
      totalP99Latency,
      avgSuccessRate: componentCount > 0 ? successRateProduct * 100 : 100
    };
  }, [nodes, edges, hiddenNodeIds, costMultipliers]);

  // Auto-fit zoom function
  const autoFitZoom = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const padding = 100; // Padding around content

    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate scale to fit content with padding
    const scaleX = (canvasRect.width - padding * 2) / contentWidth;
    const scaleY = (canvasRect.height - padding * 2) / contentHeight;
    
    // Use the smaller scale to ensure everything fits, but don't zoom out too much or in too much
    let scale = Math.min(scaleX, scaleY);
    scale = Math.max(0.3, Math.min(scale, 1.0)); // Clamp between 0.3 and 1.0 (no zoom in, limited zoom out)

    // Calculate position to center content
    const x = (canvasRect.width - contentWidth * scale) / 2 - minX * scale;
    const y = (canvasRect.height - contentHeight * scale) / 2 - minY * scale;

    setTransform({ x, y, scale });
  }, [nodes]);

  // Zoom to highlighted test elements during test execution
  const zoomToTestElements = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0 || !isTestingInProgress) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const padding = 120; // Extra padding for test focus

    // Get all highlighted nodes (test nodes, agents, tools involved in current test)
    const highlightedNodes = nodes.filter(node => {
      if (node.type === 'test') {
        // Highlight the currently running test
        return currentRunningTestId && (node.data as TestCase).id === currentRunningTestId;
      } else {
        // Highlight agents/tools that are part of the test
        return highlightedElements.has(node.id) || highlightedElements.has(node.data.id);
      }
    });

    // If no highlighted nodes, fall back to auto-fit
    if (highlightedNodes.length === 0) return;

    // Calculate bounding box of highlighted nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    highlightedNodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate scale to fit highlighted content with padding
    const scaleX = (canvasRect.width - padding * 2) / contentWidth;
    const scaleY = (canvasRect.height - padding * 2) / contentHeight;
    
    // Use slightly higher zoom for test focus (0.5 to 1.2 range)
    let scale = Math.min(scaleX, scaleY);
    scale = Math.max(0.5, Math.min(scale, 1.2)); // Allow slight zoom in for focus

    // Calculate position to center highlighted content
    const x = (canvasRect.width - contentWidth * scale) / 2 - minX * scale;
    const y = (canvasRect.height - contentHeight * scale) / 2 - minY * scale;

    // Smooth transition to new position
    setTransform({ x, y, scale });
  }, [nodes, isTestingInProgress, currentRunningTestId, highlightedElements]);

  // Auto-fit on nodes change or window resize
  useEffect(() => {
    if (nodes.length > 0) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(autoFitZoom, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, autoFitZoom]);

  // Zoom to test elements when testing is in progress or current test changes
  useEffect(() => {
    if (isTestingInProgress && nodes.length > 0) {
      // Delay to allow highlight updates to complete
      const timer = setTimeout(() => {
        zoomToTestElements();
      }, 300); // Slight delay for smoother transition
      return () => clearTimeout(timer);
    }
  }, [isTestingInProgress, currentRunningTestId, highlightedElements.size, nodes.length, zoomToTestElements]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (nodes.length > 0) {
        autoFitZoom();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodes.length, autoFitZoom]);

  // Auto-fit when visibility toggles change
  useEffect(() => {
    if (nodes.length > 0) {
      // Small delay to let nodes render
      const timer = setTimeout(() => autoFitZoom(), 100);
      return () => clearTimeout(timer);
    }
  }, [showAgents, showTools, autoFitZoom, nodes.length]);

  // Use pendingTestCases or testCases - whichever has data
  const activeTestCases = pendingTestCases.length > 0 ? pendingTestCases : testCases;
  
    // Get test cases from visible sessions - wrapped in useMemo to avoid recreating on every render
  const allDisplayedTestCases = useMemo(() => {
    // If actively generating tests, show those ONLY (the pending ones being generated)
    if (isGeneratingTests && pendingTestCases.length > 0) {
      console.log('[Canvas] Showing pending test cases (generating):', pendingTestCases.length);
      return pendingTestCases;
    }
    
    // Show test cases from visible sessions ONLY
    // Each test case should be shown per session (not deduplicated across sessions)
    const visibleSessionTestCases: TestCase[] = [];
    
    console.log('[Canvas] Computing visible session test cases');
    console.log('[Canvas] visibleSessionIds:', visibleSessionIds);
    console.log('[Canvas] testCollections:', testCollections);
    
    testCollections.forEach(collection => {
      console.log('[Canvas] Checking collection:', collection.id, 'sessions:', collection.testSessions?.length);
      collection.testSessions?.forEach(session => {
        console.log('[Canvas] Session:', session.id, 'visible?', visibleSessionIds.includes(session.id));
        if (visibleSessionIds.includes(session.id)) {
          console.log('[Canvas] Adding test cases from session:', session.id, 'count:', session.testCases?.length);
          if (session.testCases && Array.isArray(session.testCases)) {
            // Add each test case with a session-specific ID to prevent duplication issues
            session.testCases.forEach(testCase => {
              visibleSessionTestCases.push({
                ...testCase,
                // Add session ID to make each test unique per session
                id: `${session.id}-${testCase.id}`,
                // Keep original ID for result lookup
                originalId: testCase.id,
                sessionId: session.id,
              } as any);
            });
          }
        }
      });
    });
    
    console.log('[Canvas] Showing visible session test cases:', visibleSessionTestCases.length);
    return visibleSessionTestCases;
  }, [pendingTestCases, testCollections, visibleSessionIds, isGeneratingTests]);

  // Helper function to get test result from session's testReport
  const getTestResultFromSessions = useCallback((testId: string) => {
    // Extract original test ID and session ID if this is a combined ID
    let originalTestId = testId;
    let specificSessionId: string | null = null;
    
    if (testId.includes('-') && testId.split('-').length > 1) {
      const parts = testId.split('-');
      specificSessionId = parts[0];
      originalTestId = parts.slice(1).join('-');
    }
    
    // First check global testResults (for currently running tests)
    const globalResult = testResults.get(originalTestId);
    if (globalResult) return globalResult;

    // Then check the specific session's testReport if we have a session ID
    if (specificSessionId) {
      for (const collection of testCollections) {
        for (const session of collection.testSessions || []) {
          if (session.id === specificSessionId) {
            const testReport = session.testReport;
            if (testReport?.test_results) {
              const result = testReport.test_results.find((r: any) => r.test_id === originalTestId);
              if (result) return result;
            }
          }
        }
      }
    } else {
      // Fall back to checking visible sessions
      for (const collection of testCollections) {
        for (const session of collection.testSessions || []) {
          if (visibleSessionIds.includes(session.id)) {
            if (session.testCases?.some(tc => tc.id === originalTestId)) {
              const testReport = session.testReport;
              if (testReport?.test_results) {
                const result = testReport.test_results.find((r: any) => r.test_id === originalTestId);
                if (result) return result;
              }
            }
          }
        }
      }
    }
    
    return null;
  }, [testResults, testCollections, visibleSessionIds]);
  
  // Get the color for the currently running test
  const currentTestColor = currentRunningTestId 
    ? getTestCaseColor(activeTestCases.findIndex(tc => tc.id === currentRunningTestId))
    : null;

  // Calculate connected nodes for hover effect
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    
    const connected = new Set<string>();
    connected.add(hoveredNodeId); // Include the hovered node itself
    
    edges.forEach(edge => {
      if (edge.from.id === hoveredNodeId) {
        connected.add(edge.to.id);
      }
      if (edge.to.id === hoveredNodeId) {
        connected.add(edge.from.id);
      }
    });
    
    return connected;
  }, [hoveredNodeId, edges]);

  // Calculate impact region and metrics for hovered node
  const hoverImpactData = useMemo(() => {
    if (!hoveredNodeId) return null;

    const hoveredNode = nodes.find(n => n.id === hoveredNodeId);
    if (!hoveredNode) return null;

    // Get all connected nodes
    const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id) && n.id !== hoveredNodeId);
    if (connectedNodes.length === 0) return null;

    // Get connected edges
    const connectedEdges = edges.filter(e => 
      e.from.id === hoveredNodeId || e.to.id === hoveredNodeId
    );

    // Calculate bounding box with padding
    const allNodes = [hoveredNode, ...connectedNodes];
    const padding = 50;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allNodes.forEach(node => {
      minX = Math.min(minX, node.x - padding);
      minY = Math.min(minY, node.y - padding);
      maxX = Math.max(maxX, node.x + node.width + padding);
      maxY = Math.max(maxY, node.y + node.height + padding);
    });

    // Calculate convex hull points for a rounded polygon
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create rounded rectangle path
    const radius = 30;
    const points = [
      { x: minX + radius, y: minY },
      { x: maxX - radius, y: minY },
      { x: maxX, y: minY + radius },
      { x: maxX, y: maxY - radius },
      { x: maxX - radius, y: maxY },
      { x: minX + radius, y: maxY },
      { x: minX, y: maxY - radius },
      { x: minX, y: minY + radius },
    ];

    // Calculate impact metrics
    let totalCost = 0;
    let totalLatency = 0;
    let avgSuccessRate = 0;
    let edgeCount = 0;

    connectedEdges.forEach(edge => {
      // Calculate cost for edge if it has relationship data
      if (edge.data) {
        const edgeCost = calculateConnectionCost(
          edge.data,
          10,
          costMultipliers
        );
        totalCost += edgeCost.totalCost;
        totalLatency += edgeCost.p50_latency_ms || 0;
        avgSuccessRate += edgeCost.success_rate || 0;
        edgeCount++;
      }
    });

    if (edgeCount > 0) {
      avgSuccessRate /= edgeCount;
    }

    // Calculate total impact weight (nodes + edges)
    const impactWeight = connectedNodes.length + edgeCount;

    return {
      points,
      centerX,
      centerY,
      width,
      height,
      metrics: {
        totalCost,
        totalLatency,
        avgSuccessRate,
        connectedNodes: connectedNodes.length,
        connectedEdges: edgeCount,
        impactWeight,
      }
    };
  }, [hoveredNodeId, nodes, edges, connectedNodeIds, costMultipliers]);

  // Build graph from agent data with alternating zigzag pattern
  useEffect(() => {
    if (!agentData) return;

    const newNodes: CanvasNode[] = [];
    const nodeMap = new Map<string, CanvasNode>();
    
    // Spacing configuration for alternating pattern
    const horizontalSpacing = 400; // Space between columns
    const verticalSpacing = 300; // Space between rows
    const toolOffsetX = 250; // Offset tools to the right of agents
    const toolSpacing = 180; // Vertical space between tools
    
    // Filter agents and tools based on visibility toggles
    const visibleAgents = showAgents ? agentData.agents : [];
    
    // Create agent nodes in alternating up/down pattern
    visibleAgents.forEach((agent, idx) => {
      // Alternate between top (y=100) and bottom (y=100+verticalSpacing)
      const isTopRow = idx % 2 === 0;
      const col = Math.floor(idx / 2); // Two agents per column pair
      
      const node: CanvasNode = {
        id: agent.id,
        type: 'agent',
        x: 100 + (col * horizontalSpacing * 2) + (isTopRow ? 0 : horizontalSpacing),
        y: isTopRow ? 100 : 100 + verticalSpacing,
        width: 200,
        height: 120,
        data: agent,
      };
      newNodes.push(node);
      nodeMap.set(agent.id, node);

      // Create tool nodes to the right of each agent (stacked vertically)
      const agentTools = agent.tools
        .map(toolName => agentData.tools.find(t => t.name === toolName))
        .filter(Boolean) as Tool[];

      // Only show tools if showTools is enabled
      const toolsToShow = showTools ? agentTools : [];

      toolsToShow.forEach((tool, toolIdx) => {
        const toolNodeId = `${agent.id}-tool-${tool.id}`;
        
        const toolNode: CanvasNode = {
          id: toolNodeId,
          type: 'tool',
          x: node.x + node.width + toolOffsetX,
          y: node.y + (toolIdx * toolSpacing),
          width: 130,
          height: 80,
          data: { ...tool, parentAgentId: agent.id },
        };
        newNodes.push(toolNode);
        nodeMap.set(toolNodeId, toolNode);
      });
    });

    // Create edges
    const newEdges: CanvasEdge[] = [];

    // Agent to tool edges
    agentData.agents.forEach((agent) => {
      const agentNode = nodeMap.get(agent.id);
      if (!agentNode) return;

      const agentTools = agent.tools
        .map(toolName => agentData.tools.find(t => t.name === toolName))
        .filter(Boolean) as Tool[];

      agentTools.forEach((tool) => {
        const toolNodeId = `${agent.id}-tool-${tool.id}`;
        const toolNode = nodeMap.get(toolNodeId);
        if (toolNode) {
          newEdges.push({
            id: `${agent.id}-${toolNodeId}`,
            type: 'agent-tool',
            from: agentNode,
            to: toolNode,
          });
        }
      });
    });

    // Agent to agent edges with relationship data
    agentData.relationships.forEach((rel) => {
      const fromNode = nodeMap.get(rel.from_agent_id);
      const toNode = nodeMap.get(rel.to_agent_id);
      if (fromNode && toNode) {
        newEdges.push({
          id: rel.id,
          type: 'agent-agent',
          from: fromNode,
          to: toNode,
          data: rel, // Include full relationship data
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agentData, showAgents, showTools]);

  // Add test nodes when test cases are available with alternating pattern
  useEffect(() => {
    if (!agentData) return;
    
    // If generating tests, show skeleton nodes
    if (isGeneratingTests) {
      setNodes(prevNodes => {
        // Remove old test nodes
        const nonTestNodes = prevNodes.filter(n => n.type !== 'test');
        
        // Calculate the rightmost position from existing nodes
        const maxX = nonTestNodes.reduce((max, node) => Math.max(max, node.x + node.width), 0);
        
        // Create 6 skeleton test nodes in alternating pattern
        const skeletonNodes: CanvasNode[] = [];
        const testStartX = maxX + 300;
        const horizontalSpacing = 250;
        const verticalSpacing = 180;
        
        for (let idx = 0; idx < 6; idx++) {
          const isTopRow = idx % 2 === 0;
          const col = Math.floor(idx / 2);
          
          skeletonNodes.push({
            id: `skeleton-${idx}`,
            type: 'test',
            x: testStartX + (col * horizontalSpacing * 2) + (isTopRow ? 0 : horizontalSpacing),
            y: isTopRow ? 100 : 100 + verticalSpacing,
            width: 180,
            height: 100,
            data: {
              id: `skeleton-${idx}`,
              name: 'Loading...',
              category: 'tool_calling',
              description: 'Generating test case...',
              target: { type: 'agent', id: '', name: '' },
              highlight_elements: [],
              test_input: 'Generating...',
              expected_behavior: 'Loading...',
              success_criteria: 'Loading...'
            } as TestCase,
          });
        }
        
        return [...nonTestNodes, ...skeletonNodes];
      });
      return;
    }

    setNodes(prevNodes => {
      // Remove old test nodes
      const nonTestNodes = prevNodes.filter(n => n.type !== 'test');
      
      // If no test cases to display, just return non-test nodes (removes all test nodes)
      if (!allDisplayedTestCases || allDisplayedTestCases.length === 0) {
        // Also clear test edges
        setEdges(prevEdges => prevEdges.filter(e => e.type !== 'test-target'));
        return nonTestNodes;
      }
      
      // Calculate center point and bounds of existing nodes
      const bounds = nonTestNodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.x),
        maxX: Math.max(acc.maxX, node.x + node.width),
        minY: Math.min(acc.minY, node.y),
        maxY: Math.max(acc.maxY, node.y + node.height),
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      // Helper to check if position overlaps with existing nodes
      const isOverlapping = (x: number, y: number, width: number, height: number, existingNodes: CanvasNode[]) => {
        const padding = 30; // Extra space around nodes
        return existingNodes.some(node => {
          return !(x + width + padding < node.x || 
                   x > node.x + node.width + padding ||
                   y + height + padding < node.y ||
                   y > node.y + node.height + padding);
        });
      };
      
      // Create test nodes distributed around center in a circular pattern
      const testNodes: CanvasNode[] = [];
      const testNodeWidth = 180;
      const testNodeHeight = 100;
      const radius = 400; // Distance from center
      const angleStep = (2 * Math.PI) / Math.max(allDisplayedTestCases.length, 8); // Divide circle evenly
      
      allDisplayedTestCases.forEach((testCase, idx) => {
        let angle = idx * angleStep;
        let attempts = 0;
        let x, y;
        
        // Try to find a non-overlapping position
        do {
          const currentRadius = radius + (attempts * 50); // Increase radius if overlapping
          x = centerX + Math.cos(angle) * currentRadius - testNodeWidth / 2;
          y = centerY + Math.sin(angle) * currentRadius - testNodeHeight / 2;
          
          // If we've tried too many times, offset the angle slightly
          if (attempts > 0 && attempts % 3 === 0) {
            angle += angleStep / 4;
          }
          
          attempts++;
        } while (isOverlapping(x, y, testNodeWidth, testNodeHeight, [...nonTestNodes, ...testNodes]) && attempts < 20);
        
        const testNode: CanvasNode = {
          id: `test-${testCase.id}`,
          type: 'test',
          x,
          y,
          width: testNodeWidth,
          height: testNodeHeight,
          data: testCase,
        };
        testNodes.push(testNode);
      });

      const allNodes = [...nonTestNodes, ...testNodes];

      // Update edges in the same effect
      setEdges(prevEdges => {
        // Remove old test edges
        const nonTestEdges = prevEdges.filter(e => e.type !== 'test-target');
        const testEdges: CanvasEdge[] = [];

        allDisplayedTestCases.forEach((testCase) => {
          const testNodeId = `test-${testCase.id}`;
          const targetIds = testCase.highlight_elements || [];
          
          // Get test node from the new nodes array
          const testNode = allNodes.find(n => n.id === testNodeId);
          if (!testNode) return;

          // Create edges to all highlighted elements
          targetIds.forEach(targetId => {
            const targetNode = allNodes.find(n => 
              n.id === targetId || 
              (n.type === 'tool' && n.id.includes(targetId))
            );
            
            if (targetNode) {
              // Determine color based on test result from sessions
              // Use the full combined ID to get the correct result for this session
              const result = getTestResultFromSessions(testCase.id);
              const color = result 
                ? (result.status === 'passed' ? '#22c55e' : result.status === 'failed' ? '#ef4444' : '#f59e0b')
                : (isTestingInProgress && activeTestCases[currentTestIndex]?.id === testCase.id ? '#3b82f6' : '#6b7280');

              testEdges.push({
                id: `test-edge-${testCase.id}-${targetId}`,
                type: 'test-target',
                from: testNode,
                to: targetNode,
                color,
              });
            }
          });
        });

        return [...nonTestEdges, ...testEdges];
      });

      return allNodes;
    });
  }, [allDisplayedTestCases, agentData, getTestResultFromSessions, isTestingInProgress, currentTestIndex, isGeneratingTests, activeTestCases]);

  // Update edge references when nodes move
  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return;
    
    setEdges(prevEdges => prevEdges.map(edge => {
      const updatedFrom = nodes.find(n => n.id === edge.from.id);
      const updatedTo = nodes.find(n => n.id === edge.to.id);
      
      if (updatedFrom && updatedTo) {
        return {
          ...edge,
          from: updatedFrom,
          to: updatedTo,
        };
      }
      return edge;
    }));
  }, [nodes]);

  // Handler to hide/show a node with fade animation
  const toggleNodeVisibility = useCallback((nodeId: string) => {
    const isCurrentlyHidden = hiddenNodeIds.has(nodeId);
    
    if (isCurrentlyHidden) {
      // Show the node (fade in) - remove from hidden immediately
      setHiddenNodeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    } else {
      // Hide the node with fade out animation
      setFadingOutNodeIds(prevFading => new Set(prevFading).add(nodeId));
      
      // After animation completes, actually hide it
      setTimeout(() => {
        setHiddenNodeIds(prev => {
          const newSet = new Set(prev);
          newSet.add(nodeId);
          return newSet;
        });
        setFadingOutNodeIds(prevFading => {
          const newFading = new Set(prevFading);
          newFading.delete(nodeId);
          return newFading;
        });
      }, 300); // Match fadeOut animation duration
    }
    
    setContextMenu(null);
  }, [hiddenNodeIds]);

  // Handler to show all hidden nodes
  const showAllNodes = useCallback(() => {
    setHiddenNodeIds(new Set());
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      setContextMenu(null); // Close context menu
    }
  }, [transform]);

    const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode && nodeDragStart) {
      e.preventDefault();
      const deltaX = (e.clientX - nodeDragStart.x) / transform.scale;
      const deltaY = (e.clientY - nodeDragStart.y) / transform.scale;
      
      // Only move the dragged node itself, not its children
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === draggedNode.id 
          ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
          : node
      ));
      
      setNodeDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  // Node drag handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setDraggedNode(node);
    setNodeDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // Zoom handlers with limits (no zoom in beyond 1.0, limited zoom out to 0.3)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Get mouse position relative to the canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.3), 1.0);
      
      // Calculate the position in world coordinates before zoom
      const worldX = (mouseX - prev.x) / prev.scale;
      const worldY = (mouseY - prev.y) / prev.scale;
      
      // Calculate new offset to keep the mouse position fixed
      const newX = mouseX - worldX * newScale;
      const newY = mouseY - worldY * newScale;
      
      return {
        x: newX,
        y: newY,
        scale: newScale,
      };
    });
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((node: CanvasNode) => {
    if (node.type === 'agent') {
      setSelectedElement({ type: 'agent', data: node.data as Agent });
      setPanelView('details');
    } else if (node.type === 'tool') {
      setSelectedElement({ type: 'tool', data: node.data as Tool });
      setPanelView('details');
    } else if (node.type === 'test') {
      setSelectedElement({ type: 'test', data: node.data as TestCase });
      setPanelView('details');
    }
  }, [setSelectedElement, setPanelView]);

  // Edge click handler
  const handleEdgeClick = useCallback((edge: CanvasEdge) => {
    if (edge.data) {
      setSelectedElement({ type: 'relationship', data: edge.data });
      setPanelView('details');
    }
  }, [setSelectedElement, setPanelView]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
        {/* Animated node grid skeleton */}
        <div className="flex flex-col gap-6">
          {/* Top row - agents */}
          <div className="flex gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={`agent-${i}`}
                className="w-48 h-32 rounded-xl border-2 border-primary/50 bg-linear-to-br from-primary/10 to-primary/5 animate-pulse relative overflow-hidden"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-primary/30 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-primary/20 rounded w-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                </div>
              </div>
            ))}
          </div>
          
          {/* Connection lines skeleton */}
          <div className="flex gap-4 justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={`line-${i}`}
                className="w-0.5 h-16 bg-linear-to-b from-primary/50 to-green-500/50 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          
          {/* Bottom row - tools */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={`tool-${i}`}
                className="w-24 h-24 rounded-lg border-2 border-green-500/50 bg-linear-to-br from-green-500/10 to-green-500/5 animate-pulse relative overflow-hidden"
                style={{ animationDelay: `${i * 0.1 + 0.3}s` }}
              >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              <div className="p-2 space-y-2">
                <div className="h-2 bg-green-500/30 rounded w-2/3 animate-pulse" />
              </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading message with icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={canvasRef}
      className={`h-full w-full relative overflow-hidden bg-muted/30 ${
        draggedNode ? 'cursor-grabbing' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <style>{`
        .edge-group:hover .edge-path {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5)) !important;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .node-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .node-fade-out {
          animation: fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      {/* Dot pattern background */}
      <div className="canvas-background absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(100, 100, 100, 0.4) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.5,
      }} />

      {/* Canvas content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: isDragging 
            ? 'none' 
            : isTestingInProgress 
              ? 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)' // Smooth zoom during testing
              : 'transform 0.1s ease-out', // Quick zoom for manual controls
        }}
      >
        {/* Draw edges first (behind nodes) */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <marker
              id="arrowhead-green"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
            </marker>
            <marker
              id="arrowhead-red"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
            </marker>
            <marker
              id="arrowhead-blue"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
            </marker>
            
            {/* Gradient for impact region */}
            <radialGradient id="impact-gradient">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.15)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.02)" />
            </radialGradient>
          </defs>

          {/* Impact region overlay - render before edges */}
          {hoverImpactData && (
            <g className="impact-region" style={{
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {/* Rounded rectangle background */}
              <rect
                x={hoverImpactData.points[0].x - 20}
                y={hoverImpactData.points[0].y - 10}
                width={hoverImpactData.width + 40}
                height={hoverImpactData.height + 20}
                rx="30"
                ry="30"
                fill="url(#impact-gradient)"
                stroke="rgba(139, 92, 246, 0.4)"
                strokeWidth="2"
                strokeDasharray="8,4"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))',
                }}
              />
              
              {/* Impact metrics display */}
              <g transform={`translate(${hoverImpactData.centerX}, ${hoverImpactData.points[0].y - 30})`}>
                {/* Background panel */}
                <rect
                  x="-160"
                  y="-60"
                  width="320"
                  height="50"
                  rx="8"
                  fill="rgba(0, 0, 0, 0.85)"
                  stroke="rgba(139, 92, 246, 0.6)"
                  strokeWidth="1.5"
                />
                
                {/* Title */}
                <text
                  x="0"
                  y="-40"
                  textAnchor="middle"
                  fill="rgba(139, 92, 246, 1)"
                  fontSize="11"
                  fontWeight="600"
                >
                  ⚡ Node Impact Region
                </text>
                
                {/* Metrics row */}
                <g transform="translate(-140, -22)">
                  {/* Connected nodes */}
                  <text fill="#10b981" fontSize="10" fontWeight="500">
                    🔗 {hoverImpactData.metrics.connectedNodes} nodes
                  </text>
                  
                  {/* Total cost */}
                  <text x="85" fill="#f59e0b" fontSize="10" fontWeight="500">
                    💰 ${hoverImpactData.metrics.totalCost.toFixed(3)}/day
                  </text>
                  
                  {/* Average latency */}
                  <text x="200" fill="#3b82f6" fontSize="10" fontWeight="500">
                    ⚡ {hoverImpactData.metrics.totalLatency.toFixed(0)}ms
                  </text>
                </g>
                
                {/* Weight indicator */}
                <g transform="translate(0, 0)">
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.9)"
                    fontSize="9"
                  >
                    Impact Weight: <tspan fill="#8b5cf6" fontWeight="600">{hoverImpactData.metrics.impactWeight}</tspan>
                  </text>
                </g>
              </g>
            </g>
          )}
          
          {edges.map((edge) => {
            // Skip edge if either node is hidden
            if (hiddenNodeIds.has(edge.from.id) || hiddenNodeIds.has(edge.to.id)) {
              return null;
            }

            // Get edge cost for key generation to force re-render when costs change
            const edgeCost = dynamicCosts.costs.get(edge.id);
            const edgeCostKey = edgeCost ? `${edgeCost.totalCost.toFixed(6)}-${edgeCost.apiCalls}` : 'nocost';
            const edgeKey = `${edge.id}-${edgeCostKey}`;

            const fromX = edge.from.x + edge.from.width / 2;
            const fromY = edge.from.y + edge.from.height / 2;
            const toX = edge.to.x + edge.to.width / 2;
            const toY = edge.to.y + edge.to.height / 2;

            const isAgentTool = edge.type === 'agent-tool';
            const isTestTarget = edge.type === 'test-target';
            
            // Check if this is an edge from the currently running test
            const isRunningTestEdge = currentRunningTestId && isTestTarget && 
              edge.from.type === 'test' && 
              (edge.from.data as TestCase).id === currentRunningTestId;
            
            const testColor = isRunningTestEdge && currentTestColor ? currentTestColor : null;
            
            // Use test-specific color for test edges - always use the edge.color if it's a test
            const color = isTestTarget 
              ? (testColor?.primary || edge.color || '#8b5cf6') // Use test color or default purple
              : (isAgentTool ? '#10b981' : '#ef4444');
            const strokeWidth = isRunningTestEdge ? 4 : (isAgentTool ? 3 : isTestTarget ? 2 : 4);
            
            // Test edges should be dashed
            const strokeDasharray = isTestTarget ? '8,4' : undefined;
            
            // Check if this edge should be highlighted
            const isEdgeHighlighted = edge.data && highlightedElements.has(edge.data.id);
            const isEdgeErrorHighlighted = edge.data && errorHighlightedElements.has(edge.data.id);
            
            // For test-target edges, also highlight if either endpoint is highlighted
            const isTestEdgeHighlighted = isTestTarget && (
              highlightedElements.has(edge.from.id) || // Test node highlighted
              highlightedElements.has(edge.to.id) ||   // Target node highlighted
              (edge.to.type !== 'test' && highlightedElements.has(edge.to.data.id)) // Target data ID
            );
            
            const isTestEdgeErrorHighlighted = isTestTarget && (
              errorHighlightedElements.has(edge.from.id) || 
              errorHighlightedElements.has(edge.to.id) ||
              (edge.to.type !== 'test' && errorHighlightedElements.has(edge.to.data.id))
            );
            
            // Check if edge is connected to hovered node
            const isHoverHighlighted = hoveredNodeId && (
              edge.from.id === hoveredNodeId || 
              edge.to.id === hoveredNodeId
            );
            
            // Determine marker based on highlight state and edge type
            let markerId = isAgentTool ? 'arrowhead-green' : 'arrowhead-red';
            if (isEdgeErrorHighlighted || isTestEdgeErrorHighlighted) {
              markerId = 'arrowhead-red';
            } else if (isEdgeHighlighted || isTestEdgeHighlighted) {
              markerId = 'arrowhead-blue';
            }

            let path: string;

            if (isAgentTool) {
              // Vertical connection from agent to tool (smooth curve down)
              const midY = (fromY + toY) / 2;
              path = `M ${fromX} ${edge.from.y + edge.from.height} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${edge.to.y}`;
            } else if (isTestTarget) {
              // Smooth curve from test to target
              const dx = toX - fromX;
              const dy = toY - fromY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const curveOffset = Math.min(distance * 0.2, 80);
              const midX = (fromX + toX) / 2;
              const midY = (fromY + toY) / 2 + curveOffset;
              path = `M ${fromX} ${fromY} Q ${midX} ${midY}, ${toX} ${toY}`;
            } else {
              // Horizontal connection between agents (smooth curve with arc)
              const dx = toX - fromX;
              const dy = toY - fromY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Create a curved path that arcs upward or to the side
              const curveHeight = Math.min(distance * 0.3, 100);
              const midX = (fromX + toX) / 2;
              const midY = (fromY + toY) / 2 - curveHeight;
              
              path = `M ${fromX} ${fromY} Q ${midX} ${midY}, ${toX} ${toY}`;
            }
            
            // Determine stroke color based on highlight state
            let strokeColor = color;
            let strokeWidth2 = strokeWidth;
            if (isEdgeErrorHighlighted || isTestEdgeErrorHighlighted) {
              strokeColor = '#ef4444'; // Red for errors
              strokeWidth2 = strokeWidth + 3;
            } else if (isEdgeHighlighted || isTestEdgeHighlighted) {
              strokeColor = '#3b82f6'; // Blue for test edges
              strokeWidth2 = strokeWidth + 2;
            } else if (isHoverHighlighted) {
              strokeColor = '#8b5cf6'; // Purple for hover
              strokeWidth2 = strokeWidth + 1;
            }

            return (
              <g key={edgeKey} className="edge-group">
                {/* Invisible wider path for easier clicking */}
                <path
                  d={path}
                  stroke="transparent"
                  strokeWidth={strokeWidth + 10}
                  fill="none"
                  className="cursor-pointer pointer-events-auto transition-all hover:stroke-gray-400/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdgeClick(edge);
                  }}
                />
                {/* Visible path with highlight animation */}
                <path
                  d={path}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth2 * visualEffects.sizeScale}
                  strokeDasharray={strokeDasharray}
                  fill="none"
                  markerEnd={`url(#${markerId})`}
                  className={`cursor-pointer pointer-events-none transition-all edge-path ${
                    (isEdgeHighlighted || isEdgeErrorHighlighted || isTestEdgeHighlighted || isTestEdgeErrorHighlighted) ? 'animate-pulse' : ''
                  }`}
                  style={{
                    filter: (isEdgeErrorHighlighted || isTestEdgeErrorHighlighted)
                      ? 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.9))'
                      : (isEdgeHighlighted || isTestEdgeHighlighted)
                      ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))'
                      : isHoverHighlighted
                      ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.7))'
                      : 'drop-shadow(0 0 3px rgba(0,0,0,0.2))',
                    opacity: hoveredNodeId 
                      ? (isHoverHighlighted ? visualEffects.opacity : 0.3) 
                      : visualEffects.opacity,
                    transition: `all ${visualEffects.animationDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}
                />
                {/* Connection cost label - show for all connection types */}
                {(isAgentTool || !isTestTarget) && (() => {
                  // Use dynamic cost if available, otherwise calculate
                  const dynamicCost = dynamicCosts.costs.get(edge.id);
                  const connectionCost = dynamicCost || (edge.data ? 
                    calculateConnectionCost(edge.data, 10, costMultipliers) : 
                    { totalCost: 0.005, apiCalls: 100, p50_latency_ms: 25, p95_latency_ms: 50, p99_latency_ms: 75, success_rate: 99.5 }); // Default for agent-tool connections
                  
                  return (
                    <>
                      <text
                        x={(fromX + toX) / 2}
                        y={(fromY + toY) / 2 - (isAgentTool ? -15 : 35)}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="serif"
                        className="pointer-events-auto cursor-help select-none"
                      >
                        <title>
                          {`Connection Cost: ${formatCost(connectionCost.totalCost)}/day | Latency P50: ${connectionCost.p50_latency_ms}ms | P95: ${connectionCost.p95_latency_ms}ms | P99: ${connectionCost.p99_latency_ms}ms | Success Rate: ${formatSuccessRate(connectionCost.success_rate || 0)} | Data transfer overhead | Est. ${connectionCost.apiCalls} calls/day | Adjusted by objective focus`}
                        </title>
                        <tspan
                          style={{
                            paintOrder: 'stroke',
                            stroke: '#1f2937',
                            strokeWidth: '2px',
                            fill: '#d1d5db',
                            fontWeight: '600',
                          }}
                        >
                          {formatCost(connectionCost.totalCost)}/day
                        </tspan>
                      </text>
                      {/* Latency label below cost */}
                      {connectionCost.p50_latency_ms !== undefined && (
                        <text
                          x={(fromX + toX) / 2}
                          y={(fromY + toY) / 2 - (isAgentTool ? -30 : 20)}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="500"
                          fontFamily="serif"
                          className="pointer-events-none select-none"
                        >
                          <tspan
                            style={{
                              paintOrder: 'stroke',
                              stroke: '#1f2937',
                              strokeWidth: '2px',
                              fill: connectionCost.p50_latency_ms > 500 ? '#fbbf24' : '#a3e635',
                              fontWeight: '500',
                            }}
                          >
                            {formatLatency(connectionCost.p50_latency_ms, 'p50')}
                          </tspan>
                        </text>
                      )}
                    </>
                  );
                })()}
                {edge.data && !isAgentTool && !isTestTarget && (
                  <>
                    <text
                      x={(fromX + toX) / 2}
                      y={(fromY + toY) / 2 - 50}
                      textAnchor="middle"
                      fill={color}
                      fontSize="14"
                      fontWeight="700"
                      className="pointer-events-none select-none"
                    >
                      <tspan
                        x={(fromX + toX) / 2}
                        dy="-5"
                        style={{
                          paintOrder: 'stroke',
                          stroke: '#1f2937',
                          strokeWidth: '3px',
                          fill: color,
                        }}
                      >
                        {edge.data.type}
                      </tspan>
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Draw nodes */}
        {nodes.map((node) => {
          // For test nodes, check if the node.id (which includes 'test-' prefix) is highlighted
          // For other nodes, check node.data.id
          const isHighlighted = node.type === 'test' 
            ? highlightedElements.has(node.id)
            : highlightedElements.has(node.data.id);
          const isErrorHighlighted = node.type === 'test'
            ? errorHighlightedElements.has(node.id)
            : errorHighlightedElements.has(node.data.id);
          const isWarningHighlighted = node.type === 'test'
            ? warningHighlightedElements.has(node.id)
            : warningHighlightedElements.has(node.data.id);
          const isAgent = node.type === 'agent';
          const isTest = node.type === 'test';
          
          // Check if this test node is currently running
          const isRunningTest = isTest && isTestingInProgress && 
            testCases[currentTestIndex]?.id === (node.data as TestCase).id;
          
          // Check if this node is a target of the currently running test
          const isRunningTestTarget = currentRunningTestId && !isTest && 
            edges.some(e => 
              e.type === 'test-target' && 
              e.from.type === 'test' &&
              (e.from.data as TestCase).id === currentRunningTestId &&
              e.to.id === node.id
            );
          
          // Check if test has results from sessions
          const testResult = isTest ? getTestResultFromSessions((node.data as TestCase).id) : null;
          
          // Find test session color for this test node
          let sessionGradient: string | null = null;
          if (isTest) {
            const testData = node.data as any; // Has sessionId property
            const testId = testData.id;
            
            // If we have a sessionId on the test data, use it directly
            if (testData.sessionId) {
              const session = testCollections
                .flatMap(c => c.testSessions || [])
                .find(s => s.id === testData.sessionId);
              if (session) {
                sessionGradient = session.color;
              }
            } else {
              // Fallback: find session containing this test that is visible
              const visibleSessions = testCollections
                .flatMap(c => c.testSessions || [])
                .filter(s => visibleSessionIds.includes(s.id) && s.testCases?.some(tc => tc.id === testId));
              // Use first visible session's color (priority to most recently added)
              if (visibleSessions.length > 0) {
                sessionGradient = visibleSessions[visibleSessions.length - 1].color;
              }
            }
          }
          
          // Determine styling based on highlight state
          let borderClass = '';
          let bgClass = '';
          let effectClass = '';
          let customStyle: React.CSSProperties = {};
          
          if (isTest) {
            // Test node styling
            if (isRunningTest || isHighlighted) {
              // Running or explicitly highlighted - use test-specific color
              const testColor = currentTestColor || getTestCaseColor(currentTestIndex);
              borderClass = '';
              bgClass = testColor.bg;
              effectClass = `shadow-xl scale-110 ring-4 animate-pulse ${testColor.ring}`;
              customStyle.borderColor = testColor.primary;
              customStyle.borderWidth = '2px';
              customStyle.borderStyle = 'solid';
              customStyle.boxShadow = `0 0 20px ${testColor.glow}`;
            } else if (testResult) {
              if (testResult.status === 'passed') {
                borderClass = 'border-green-500';
                bgClass = 'bg-green-50 dark:bg-green-900/20';
                effectClass = 'hover:scale-105';
              } else if (testResult.status === 'failed') {
                borderClass = 'border-red-500';
                bgClass = 'bg-red-50 dark:bg-red-900/20';
                effectClass = 'hover:scale-105';
              } else if (testResult.status === 'warning') {
                borderClass = 'border-amber-500';
                bgClass = 'bg-amber-50 dark:bg-amber-900/20';
                effectClass = 'hover:scale-105';
              }
            } else if (sessionGradient) {
              // Use session gradient color if test belongs to visible session
              borderClass = 'border-transparent';
              effectClass = 'hover:scale-105 shadow-lg';
              customStyle.background = sessionGradient;
              customStyle.borderImage = `${sessionGradient} 1`;
              customStyle.borderWidth = '2px';
              customStyle.borderStyle = 'solid';
            } else {
              borderClass = 'border-purple-500/60 hover:border-purple-500';
              bgClass = 'bg-linear-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50';
              effectClass = 'hover:scale-105';
            }
          } else if (isErrorHighlighted) {
            borderClass = 'border-red-500';
            bgClass = 'bg-red-50 dark:bg-red-900/20';
            effectClass = 'shadow-xl scale-110 ring-4 ring-red-500/50 animate-pulse';
          } else if (isWarningHighlighted) {
            // Persistent warning highlight for elements with recommendations
            borderClass = 'border-orange-500';
            bgClass = 'bg-orange-50 dark:bg-orange-900/20';
            effectClass = 'shadow-lg ring-2 ring-orange-500/50';
          } else if (isRunningTestTarget) {
            // Highlight target nodes with test-specific color
            const testColor = currentTestColor || getTestCaseColor(currentTestIndex);
            borderClass = '';
            bgClass = testColor.bg;
            effectClass = `shadow-lg scale-105 ring-2 ${testColor.ring}`;
            customStyle.borderColor = testColor.primary;
            customStyle.borderWidth = '2px';
            customStyle.borderStyle = 'solid';
            customStyle.boxShadow = `0 0 15px ${testColor.glow}`;
          } else if (isHighlighted) {
            borderClass = 'border-yellow-400';
            bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
            effectClass = 'shadow-xl scale-110 ring-4 ring-yellow-400/50 animate-pulse';
          } else if (isAgent) {
            borderClass = 'border-blue-500/60 hover:border-blue-500';
            bgClass = 'bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50';
            effectClass = 'hover:scale-105';
          } else {
            borderClass = 'border-green-500/60 hover:border-green-500';
            bgClass = 'bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50';
            effectClass = 'hover:scale-105';
          }

          // Skip rendering if node is hidden (but not if it's fading out)
          if (hiddenNodeIds.has(node.id) && !fadingOutNodeIds.has(node.id)) {
            return null;
          }

          // Check if this node is connected to hovered node
          const isConnectedToHovered = hoveredNodeId && connectedNodeIds.has(node.id) && node.id !== hoveredNodeId;
          const isCurrentlyHovered = node.id === hoveredNodeId;
          
          // Determine fade animation class
          const isFadingOut = fadingOutNodeIds.has(node.id);
          const isFadingIn = !hiddenNodeIds.has(node.id) && !isFadingOut;
          const fadeClass = isFadingOut ? 'node-fade-out' : isFadingIn ? 'node-fade-in' : '';

          // Get node cost for key generation to force re-render when costs change
          const nodeCost = dynamicCosts.costs.get(node.id);
          const costKey = nodeCost ? `${nodeCost.totalCost.toFixed(6)}-${nodeCost.apiCalls}` : 'nocost';

          return (
            <div
              key={`${node.id}-${costKey}`}
              className={`absolute cursor-move transition-all ${
                isAgent
                  ? `group px-5 py-4 rounded-xl border-2 shadow-lg hover:shadow-2xl ${borderClass} ${bgClass} ${effectClass}`
                  : isTest
                  ? `group px-3 py-2.5 rounded-lg border-2 shadow-md hover:shadow-lg ${borderClass} ${bgClass} ${effectClass}`
                  : `group px-3 py-2.5 rounded-lg border-2 shadow-md hover:shadow-lg ${borderClass} ${bgClass} ${effectClass}`
              } ${isConnectedToHovered ? 'ring-2 ring-purple-400/60' : ''} ${isCurrentlyHovered ? 'ring-4 ring-purple-500/80' : ''} ${fadeClass}`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                backdropFilter: 'blur(10px)',
                opacity: hoveredNodeId 
                  ? (isCurrentlyHovered || isConnectedToHovered ? visualEffects.opacity : 0.4) 
                  : visualEffects.opacity,
                transform: isConnectedToHovered 
                  ? `scale(${1.05 * visualEffects.sizeScale})` 
                  : isCurrentlyHovered 
                  ? `scale(${1.08 * visualEffects.sizeScale})` 
                  : `scale(${visualEffects.sizeScale})`,
                filter: `saturate(${visualEffects.colorIntensity})`,
                transition: `all ${visualEffects.animationDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                ...customStyle,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  nodeId: node.id,
                });
              }}
              onClick={(e) => {
                if (!draggedNode) {
                  e.stopPropagation();
                  handleNodeClick(node);
                }
              }}
            >
              {/* Quick hide button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeVisibility(node.id);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-muted hover:scale-110"
                title="Hide this node"
              >
                <span className="text-xs">👁️</span>
              </button>

              {isAgent ? (
                <>
                  <AgentNode 
                    data={node.data as Agent} 
                    cost={dynamicCosts.costs.get(node.id)}
                  />
                  {isWarningHighlighted && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                      ⚠️
                    </div>
                  )}
                </>
              ) : isTest ? (
                <TestNode 
                  data={node.data as TestCase} 
                  result={testResult}
                  isRunning={isRunningTest}
                />
              ) : (
                <>
                  <ToolNode 
                    data={node.data as Tool}
                    cost={dynamicCosts.costs.get(node.id)}
                  />
                  {isWarningHighlighted && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                      ⚠️
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-background border border-border rounded-lg shadow-lg p-2">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 1.0) }))}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom In (Max 100%)"
          disabled={transform.scale >= 1.0}
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.3) }))}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom Out (Min 30%)"
          disabled={transform.scale <= 0.3}
        >
          −
        </button>
        <button
          onClick={autoFitZoom}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors text-xs font-bold"
          title="Fit to Window"
        >
          ⊡
        </button>
      </div>

      {/* Visibility toggles */}
      <div className="absolute bottom-4 left-16 flex flex-col gap-2 bg-background border border-border rounded-lg shadow-lg p-3">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors">
          <input
            type="checkbox"
            checked={showAgents}
            onChange={(e) => setShowAgents(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-blue-500 cursor-pointer"
          />
          <span className="text-xs font-medium text-foreground/80 select-none">Agents</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors">
          <input
            type="checkbox"
            checked={showTools}
            onChange={(e) => setShowTools(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-green-500 cursor-pointer"
          />
          <span className="text-xs font-medium text-foreground/80 select-none">Tools</span>
        </label>
        {hiddenNodeIds.size > 0 && (
          <button
            onClick={showAllNodes}
            className="mt-1 px-2 py-1 text-xs font-medium text-foreground/80 hover:bg-muted/50 rounded transition-colors border-t border-border/50 pt-2"
            title={`Show ${hiddenNodeIds.size} hidden node(s)`}
          >
            👁️ Show All ({hiddenNodeIds.size})
          </button>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded-lg shadow-xl py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => toggleNodeVisibility(contextMenu.nodeId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
          >
            <span>👁️</span>
            <span>Hide Node</span>
          </button>
        </div>
      )}

      {/* Mini info */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-background/90 border border-border rounded-lg shadow-lg px-3 py-2 text-sm backdrop-blur">
          Zoom: {Math.round(transform.scale * 100)}%
        </div>
        <div className="bg-background/90 border border-border rounded-lg shadow-lg px-3 py-2.5 backdrop-blur">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-xs font-serif text-muted-foreground">Total Canvas Cost:</span>
            <span className={`text-sm font-serif font-bold ${getCostColor(dynamicCosts.totalCanvasCost)} tracking-wide`}>
              {formatCost(dynamicCosts.totalCanvasCost)}/day
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-xs font-serif text-muted-foreground">Latency P50:</span>
            <span className={`text-sm font-serif font-bold ${getLatencyColor(dynamicCosts.totalP50Latency)} tracking-wide`}>
              {formatLatency(dynamicCosts.totalP50Latency, 'p50')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-xs font-serif text-muted-foreground">Latency P95:</span>
            <span className={`text-sm font-serif font-bold ${getLatencyColor(dynamicCosts.totalP95Latency)} tracking-wide`}>
              {formatLatency(dynamicCosts.totalP95Latency, 'p95')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-xs font-serif text-muted-foreground">Latency P99:</span>
            <span className={`text-sm font-serif font-bold ${getLatencyColor(dynamicCosts.totalP99Latency)} tracking-wide`}>
              {formatLatency(dynamicCosts.totalP99Latency, 'p99')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-serif text-muted-foreground">Avg Success Rate:</span>
            <span className={`text-sm font-serif font-bold ${getSuccessRateColor(dynamicCosts.avgSuccessRate)} tracking-wide`}>
              {formatSuccessRate(dynamicCosts.avgSuccessRate)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2 pt-1.5 border-t border-border/50 font-mono">
            {nodes.filter(n => !hiddenNodeIds.has(n.id)).length} visible nodes
          </div>
        </div>
      </div>

      {/* Session Selector */}
      <SessionSelector />

      {/* Research Report Modal - Shows test session details with fix review */}
      {(() => {
        console.log('[Canvas] Modal check - showProgressReport:', showProgressReport);
        console.log('[Canvas] Modal check - currentProgressSessionId:', currentProgressSessionId);
        console.log('[Canvas] Modal check - testCollections:', testCollections.length);
        
        if (!showProgressReport || !currentProgressSessionId) {
          return null;
        }
        
        const session = testCollections
          .flatMap(c => c.testSessions || [])
          .find(s => s.id === currentProgressSessionId);
        
        console.log('[Canvas] Research Report Modal - session found:', !!session);
        console.log('[Canvas] Research Report Modal - session:', session);
        console.log('[Canvas] testReport exists:', !!session?.testReport);
        console.log('[Canvas] testReport value:', session?.testReport);
        
        if (!session) {
          console.log('[Canvas] No session found for ID:', currentProgressSessionId);
          return null;
        }
        
        if (!session.testReport) {
          console.log('[Canvas] No testReport in session:', session.id);
          console.log('[Canvas] Session keys:', Object.keys(session));
          return null;
        }
        
        // Use test cases from session directly (already stored as full objects)
        const sessionTestCases: TestCase[] = session.testCases || [];
        
        console.log('[Canvas] Session test cases count:', sessionTestCases.length);
        console.log('[Canvas] Rendering ResearchReportModal');
        
        return (
          <ResearchReportModal
            testReport={session.testReport}
            testCases={sessionTestCases}
            fixes={session.fixes || []}
            onClose={() => useStore.getState().setShowProgressReport(false)}
            onAcceptFix={(fixId) => acceptFix(fixId, currentProgressSessionId)}
            onRejectFix={(fixId) => rejectFix(fixId, currentProgressSessionId)}
            canExport={session.fixes?.every(f => f.status !== 'pending') ?? true}
            appliedToGithub={session.appliedToGithub}
            githubPrUrl={session.githubPrUrl}
          />
        );
      })()}

      {/* Documentation Button - Bottom right, above Objective Focus */}
      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/docs">
          <button
            className="bg-background border-2 border-primary/30 rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:border-primary/50 hover:scale-105"
            title="Documentation & Guide"
          >
            <BookOpen className="w-6 h-6 text-primary" />
          </button>
        </Link>
      </div>

      {/* Objective Focus Control Panel */}
      <ObjectiveFocusPanel />
    </div>
  );
}

// Agent Node Component
function AgentNode({ data, cost }: { 
  data: Agent; 
  cost?: { 
    totalCost: number; 
    apiCalls: number;
    p50_latency_ms?: number;
    p95_latency_ms?: number;
    p99_latency_ms?: number;
    success_rate?: number;
  } 
}) {
  const defaultCost = calculateAgentCost(data);
  const displayCost = cost || defaultCost;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          🤖
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base text-blue-700 dark:text-blue-300 leading-tight">
            {data.name}
          </h3>
          <span className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
            {data.type}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 mt-1">
        {data.tools && data.tools.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-lg">🔧</span>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              {data.tools.length} {data.tools.length === 1 ? 'tool' : 'tools'}
            </span>
          </div>
        )}
        <div className="flex flex-col items-end gap-0.5">
          <div 
            className={`text-xs font-serif font-semibold ${getCostColor(displayCost.totalCost)} tracking-wide`}
            title={`Agent Cost: ${formatCost(displayCost.totalCost)}/day | Est. ${displayCost.apiCalls} API calls/day | Adjusted by objective focus | Click for detailed breakdown`}
          >
            {formatCost(displayCost.totalCost)}/day
          </div>
          {displayCost.p50_latency_ms !== undefined && (
            <div 
              className={`text-[10px] font-serif font-medium ${getLatencyColor(displayCost.p50_latency_ms)} tracking-wide`}
              title={`P50: ${displayCost.p50_latency_ms}ms | P95: ${displayCost.p95_latency_ms}ms | P99: ${displayCost.p99_latency_ms}ms | Success Rate: ${formatSuccessRate(displayCost.success_rate || 0)}`}
            >
              {formatLatency(displayCost.p50_latency_ms, 'p50')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tool Node Component
function ToolNode({ data, cost }: { 
  data: Tool; 
  cost?: { 
    totalCost: number; 
    apiCalls: number;
    p50_latency_ms?: number;
    p95_latency_ms?: number;
    p99_latency_ms?: number;
    success_rate?: number;
  } 
}) {
  const defaultCost = calculateToolCost(data);
  const displayCost = cost || defaultCost;
  
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
        🔧
      </div>
      <span className="text-xs font-semibold text-green-700 dark:text-green-300 text-center line-clamp-2 leading-tight">
        {data.name}
      </span>
      <div className="flex flex-col items-center gap-0.5">
        <span 
          className={`text-[10px] font-serif font-semibold ${getCostColor(displayCost.totalCost)} tracking-wide`}
          title={`Tool Cost: ${formatCost(displayCost.totalCost)}/day | Execution overhead | Est. ${displayCost.apiCalls} calls/day | Adjusted by objective focus | Click for detailed breakdown`}
        >
          {formatCost(displayCost.totalCost)}/day
        </span>
        {displayCost.p50_latency_ms !== undefined && (
          <span 
            className={`text-[9px] font-serif font-medium ${getLatencyColor(displayCost.p50_latency_ms)} tracking-wide`}
            title={`P50: ${displayCost.p50_latency_ms}ms | P95: ${displayCost.p95_latency_ms}ms | P99: ${displayCost.p99_latency_ms}ms | Success Rate: ${formatSuccessRate(displayCost.success_rate || 0)}`}
          >
            {formatLatency(displayCost.p50_latency_ms, 'p50')}
          </span>
        )}
      </div>
    </div>
  );
}

// Test Node Component  
function TestNode({ data, result, isRunning }: { data: TestCase; result: any; isRunning: boolean }) {
  const isSkeleton = data.name === 'Loading...';
  
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'tool_calling': '🔧',
      'reasoning': '🧠',
      'performance': '⚡',
      'collaborative': '🤝',
      'relationship': '🔗',
      'connection': '📡',
      'security': '🔒',
      'error_handling': '⚠️',
      'output_quality': '✨',
      'edge_case': '🎯',
      'prompt_injection': '🛡️',
      'hyperparameter': '⚙️',
    };
    return icons[category] || '📋';
  };

  const getStatusIcon = () => {
    if (isRunning) return '▶️';
    if (!result) return '⏸️';
    if (result.status === 'passed') return '✅';
    if (result.status === 'failed') return '❌';
    if (result.status === 'warning') return '⚠️';
    return '❓';
  };

  // Check if there are recommendations
  const hasRecommendations = result?.recommendations && result.recommendations.length > 0;

  // Skeleton loading state
  if (isSkeleton) {
    return (
      <div className="flex flex-col gap-2 relative animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <div className="w-4 h-4 bg-purple-500/40 rounded" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 bg-purple-500/30 rounded w-3/4" />
            <div className="h-2 bg-purple-500/20 rounded w-1/2" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-2 bg-purple-500/20 rounded flex-1 mr-2" />
          <div className="w-4 h-4 bg-purple-500/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 relative">
      {/* Recommendation badge */}
      {hasRecommendations && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs z-10 shadow-md">
          💡
        </div>
      )}
      
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
          {getCategoryIcon(data.category)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif font-bold text-sm text-purple-700 dark:text-purple-300 leading-tight">
            {data.name}
          </h4>
          <span className="text-xs text-purple-600/70 dark:text-purple-400/70 font-serif font-medium">
            {data.category}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-xs font-serif text-muted-foreground truncate flex-1">
          Target: <span className="font-semibold">{data.target.name}</span>
        </span>
        <span className="text-lg ml-2">
          {getStatusIcon()}
        </span>
      </div>
      
      {/* Running progress bar */}
      {isRunning && (
        <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900/30 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-blue-500 animate-pulse rounded-full" style={{ width: '60%' }} />
        </div>
      )}

      {/* Test Results Summary */}
      {result && !isRunning && (
        <div className="space-y-2 pt-2 border-t border-purple-500/20">
          {/* Status summary */}
          <div className={`text-xs font-serif font-semibold px-2.5 py-1.5 rounded-md ${
            result.status === 'passed' 
              ? 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20' 
              : result.status === 'failed'
              ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
          }`}>
            {result.results?.summary || 'Test completed'}
          </div>

          {/* Execution time */}
          {result.execution_time && (
            <div className="flex items-center justify-between text-xs font-serif px-1">
              <span className="text-muted-foreground">Execution Time:</span>
              <span className="font-mono font-bold text-foreground">{result.execution_time.toFixed(2)}s</span>
            </div>
          )}

          {/* Issues found count */}
          {result.results?.issues_found && result.results.issues_found.length > 0 && (
            <div className="flex items-center justify-between text-xs font-serif px-1">
              <span className="text-muted-foreground">Issues Found:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {result.results.issues_found.length}
              </span>
            </div>
          )}

          {/* Metrics summary */}
          {result.results?.metrics && result.results.metrics.length > 0 && (
            <div className="space-y-1">
              {result.results.metrics.slice(0, 2).map((metric: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs font-serif px-1">
                  <span className="text-muted-foreground truncate flex-1 mr-2">
                    {metric.name}:
                  </span>
                  <span className={`font-mono font-bold ${
                    metric.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.value !== undefined ? `${metric.value}${metric.unit || ''}` : (metric.passed ? '✓' : '✗')}
                  </span>
                </div>
              ))}
              {result.results.metrics.length > 2 && (
                <div className="text-xs font-serif text-muted-foreground text-center italic">
                  +{result.results.metrics.length - 2} more metrics
                </div>
              )}
            </div>
          )}

          {/* Recommendations count */}
          {hasRecommendations && (
            <div className="flex items-center gap-1 text-[9px] text-amber-700 dark:text-amber-300 px-1 py-1 bg-amber-500/5 rounded">
              <span>💡</span>
              <span className="font-semibold">
                {result.recommendations.length} recommendation{result.recommendations.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
