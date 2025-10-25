'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Agent, Tool, Relationship, TestCase } from '@/types';

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
  const { agentData, isLoading, loadingMessage, isGeneratingTests, highlightedElements, errorHighlightedElements, warningHighlightedElements, setSelectedElement, setPanelView, testCases, pendingTestCases, testResults, currentTestIndex, isTestingInProgress } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<CanvasNode | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });

  // Use pendingTestCases or testCases - whichever has data
  const activeTestCases = pendingTestCases.length > 0 ? pendingTestCases : testCases;

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
    
    // Create agent nodes in alternating up/down pattern
    agentData.agents.forEach((agent, idx) => {
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

      agentTools.forEach((tool, toolIdx) => {
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
  }, [agentData]);

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
    
    if (!activeTestCases || activeTestCases.length === 0) return;

    setNodes(prevNodes => {
      // Remove old test nodes
      const nonTestNodes = prevNodes.filter(n => n.type !== 'test');
      
      // Calculate the rightmost position from existing nodes
      const maxX = nonTestNodes.reduce((max, node) => Math.max(max, node.x + node.width), 0);
      
      // Create test nodes in alternating zigzag pattern to the right
      const testNodes: CanvasNode[] = [];
      const testStartX = maxX + 300; // Start tests well to the right of existing nodes
      const horizontalSpacing = 250; // Space between columns
      const verticalSpacing = 180; // Space between rows
      
      activeTestCases.forEach((testCase, idx) => {
        // Alternate between top and bottom rows
        const isTopRow = idx % 2 === 0;
        const col = Math.floor(idx / 2); // Two tests per column pair
        
        const testNode: CanvasNode = {
          id: `test-${testCase.id}`,
          type: 'test',
          x: testStartX + (col * horizontalSpacing * 2) + (isTopRow ? 0 : horizontalSpacing),
          y: isTopRow ? 100 : 100 + verticalSpacing,
          width: 180,
          height: 100,
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

        activeTestCases.forEach((testCase) => {
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
              // Determine color based on test result
              const result = testResults.get(testCase.id);
              let color = '#6b7280'; // default gray
              if (result) {
                if (result.status === 'passed') color = '#22c55e'; // green
                else if (result.status === 'failed') color = '#ef4444'; // red
                else if (result.status === 'warning') color = '#f59e0b'; // amber
              } else if (isTestingInProgress && activeTestCases[currentTestIndex]?.id === testCase.id) {
                color = '#3b82f6'; // blue for currently running
              }

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
  }, [activeTestCases, agentData, testResults, isTestingInProgress, currentTestIndex]);

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

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
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

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.1), 2),
    }));
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
      `}</style>
      {/* Grid background */}
      <div className="canvas-background absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        opacity: 0.3,
      }} />

      {/* Canvas content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
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
          </defs>
          
          {edges.map((edge) => {
            const fromX = edge.from.x + edge.from.width / 2;
            const fromY = edge.from.y + edge.from.height / 2;
            const toX = edge.to.x + edge.to.width / 2;
            const toY = edge.to.y + edge.to.height / 2;

            const isAgentTool = edge.type === 'agent-tool';
            const isTestTarget = edge.type === 'test-target';
            
            // Use edge.color for test-target edges
            let color = isTestTarget && edge.color ? edge.color : (isAgentTool ? '#10b981' : '#ef4444');
            const strokeWidth = isAgentTool ? 3 : isTestTarget ? 2 : 4;
            
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
              strokeColor = '#3b82f6'; // Blue for test edges, yellow for others
              strokeWidth2 = strokeWidth + 2;
            }

            return (
              <g key={edge.id} className="edge-group">
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
                  strokeWidth={strokeWidth2}
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
                      : 'drop-shadow(0 0 3px rgba(0,0,0,0.2))',
                  }}
                />
                {edge.data && (
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - (isAgentTool ? 0 : 50)}
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
          
          // Check if test has results
          const testResult = isTest ? testResults.get((node.data as TestCase).id) : null;
          
          // Determine styling based on highlight state
          let borderClass = '';
          let bgClass = '';
          let effectClass = '';
          
          if (isTest) {
            // Test node styling
            if (isRunningTest || isHighlighted) {
              // Running or explicitly highlighted
              borderClass = 'border-blue-500';
              bgClass = 'bg-blue-50 dark:bg-blue-900/20';
              effectClass = 'shadow-xl scale-110 ring-4 ring-blue-500/50 animate-pulse';
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

          return (
            <div
              key={node.id}
              className={`absolute cursor-move transition-all duration-300 ${
                isAgent
                  ? `group px-5 py-4 rounded-xl border-2 shadow-lg hover:shadow-2xl ${borderClass} ${bgClass} ${effectClass}`
                  : isTest
                  ? `group px-3 py-2.5 rounded-lg border-2 shadow-md hover:shadow-lg ${borderClass} ${bgClass} ${effectClass}`
                  : `group px-3 py-2.5 rounded-lg border-2 shadow-md hover:shadow-lg ${borderClass} ${bgClass} ${effectClass}`
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                backdropFilter: 'blur(10px)',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onClick={(e) => {
                if (!draggedNode) {
                  e.stopPropagation();
                  handleNodeClick(node);
                }
              }}
            >
              {isAgent ? (
                <>
                  <AgentNode data={node.data as Agent} />
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
                  <ToolNode data={node.data as Tool} />
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
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 2) }))}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.1) }))}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 0.8 })}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors text-xs"
          title="Reset View"
        >
          ⟲
        </button>
      </div>

      {/* Mini info */}
      <div className="absolute top-4 right-4 bg-background/90 border border-border rounded-lg shadow-lg px-3 py-2 text-sm backdrop-blur">
        Zoom: {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}

// Agent Node Component
function AgentNode({ data }: { data: Agent }) {
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
      
      {data.tools && data.tools.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg">🔧</span>
          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
            {data.tools.length} {data.tools.length === 1 ? 'tool' : 'tools'}
          </span>
        </div>
      )}
    </div>
  );
}

// Tool Node Component
function ToolNode({ data }: { data: Tool }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
        🔧
      </div>
      <span className="text-xs font-semibold text-green-700 dark:text-green-300 text-center line-clamp-2 leading-tight">
        {data.name}
      </span>
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
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] z-10">
          💡
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
          {getCategoryIcon(data.category)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xs text-purple-700 dark:text-purple-300 leading-tight truncate">
            {data.name}
          </h4>
          <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium">
            {data.category}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground truncate flex-1">
          Target: {data.target.name}
        </span>
        <span className="text-base ml-1">
          {getStatusIcon()}
        </span>
      </div>
      
      {isRunning && (
        <div className="w-full h-1 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
}
