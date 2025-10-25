'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Agent, Tool, Relationship } from '@/types';

interface CanvasNode {
  id: string;
  type: 'agent' | 'tool';
  x: number;
  y: number;
  width: number;
  height: number;
  data: Agent | Tool | (Tool & { parentAgentId?: string });
}

interface CanvasEdge {
  id: string;
  type: 'agent-tool' | 'agent-agent';
  from: CanvasNode;
  to: CanvasNode;
  data?: Relationship;
}

export function Canvas() {
  const { agentData, isLoading, loadingMessage, highlightedElements, setSelectedElement, setPanelView } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<CanvasNode | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });

  // Build graph from agent data
  useEffect(() => {
    if (!agentData) return;

    const newNodes: CanvasNode[] = [];
    const nodeMap = new Map<string, CanvasNode>();
    const agentSpacing = 800;
    const toolOffsetY = 350;
    const toolSpacing = 200;

    // Create agent nodes
    agentData.agents.forEach((agent, idx) => {
      const node: CanvasNode = {
        id: agent.id,
        type: 'agent',
        x: idx * agentSpacing,
        y: 100,
        width: 200,
        height: 120,
        data: agent,
      };
      newNodes.push(node);
      nodeMap.set(agent.id, node);

      // Create tool nodes below each agent
      const agentTools = agent.tools
        .map(toolName => agentData.tools.find(t => t.name === toolName))
        .filter(Boolean) as Tool[];

      agentTools.forEach((tool, toolIdx) => {
        const toolNodeId = `${agent.id}-tool-${tool.id}`;
        const totalToolsWidth = (agentTools.length - 1) * toolSpacing;
        const startX = idx * agentSpacing - totalToolsWidth / 2;

        const toolNode: CanvasNode = {
          id: toolNodeId,
          type: 'tool',
          x: startX + (toolIdx * toolSpacing),
          y: 100 + toolOffsetY,
          width: 130,
          height: 80,
          data: { ...tool, parentAgentId: agent.id }, // Store parent agent ID
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
      
      setNodes(prevNodes => prevNodes.map(node => {
        // Move the dragged node
        if (node.id === draggedNode.id) {
          return { ...node, x: node.x + deltaX, y: node.y + deltaY };
        }
        // If dragged node is an agent, also move all its tool children
        if (draggedNode.type === 'agent' && node.type === 'tool') {
          const toolData = node.data as Tool & { parentAgentId?: string };
          if (toolData.parentAgentId === draggedNode.id) {
            return { ...node, x: node.x + deltaX, y: node.y + deltaY };
          }
        }
        return node;
      }));
      
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
          </defs>
          
          {edges.map((edge) => {
            const fromX = edge.from.x + edge.from.width / 2;
            const fromY = edge.from.y + edge.from.height / 2;
            const toX = edge.to.x + edge.to.width / 2;
            const toY = edge.to.y + edge.to.height / 2;

            const isAgentTool = edge.type === 'agent-tool';
            const color = isAgentTool ? '#10b981' : '#ef4444';
            const strokeWidth = isAgentTool ? 3 : 4;
            const markerId = isAgentTool ? 'arrowhead-green' : 'arrowhead-red';

            let path: string;

            if (isAgentTool) {
              // Vertical connection from agent to tool (smooth curve down)
              const midY = (fromY + toY) / 2;
              path = `M ${fromX} ${edge.from.y + edge.from.height} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${edge.to.y}`;
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
                {/* Visible path */}
                <path
                  d={path}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  markerEnd={`url(#${markerId})`}
                  className="cursor-pointer pointer-events-none transition-all edge-path"
                  style={{
                    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.2))',
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
          const isHighlighted = highlightedElements.has(node.data.id);
          const isAgent = node.type === 'agent';

          return (
            <div
              key={node.id}
              className={`absolute cursor-move transition-all duration-300 ${
                isAgent
                  ? 'group px-5 py-4 rounded-xl border-2 shadow-lg hover:shadow-2xl ' +
                    (isHighlighted
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl scale-110 ring-4 ring-yellow-400/50 animate-pulse'
                      : 'border-blue-500/60 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 hover:border-blue-500 hover:scale-105')
                  : 'group px-3 py-2.5 rounded-lg border-2 shadow-md hover:shadow-lg ' +
                    (isHighlighted
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl scale-110 ring-4 ring-yellow-400/50 animate-pulse'
                      : 'border-green-500/60 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 hover:border-green-500 hover:scale-105')
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
                <AgentNode data={node.data as Agent} />
              ) : (
                <ToolNode data={node.data as Tool} />
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
