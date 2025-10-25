'use client';

import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeMouseHandler,
  Position,
} from 'reactflow';
import { useStore } from '@/lib/store';
import { Agent, Tool, Relationship } from '@/types';

export function Canvas() {
  const { agentData, isLoading, loadingMessage, highlightedElements, setSelectedElement, setPanelView } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build graph from agent data
  useEffect(() => {
    if (!agentData) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodeSpacing = 400;

    // Create agent nodes (large blocks)
    agentData.agents.forEach((agent, idx) => {
      newNodes.push({
        id: agent.id,
        type: 'agentNode',
        position: { x: idx * nodeSpacing, y: 100 },
        data: { 
          ...agent,
          isHighlighted: highlightedElements.has(agent.id)
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      // Create tool nodes for this agent
      agent.tools.forEach((toolName, toolIdx) => {
        const tool = agentData.tools.find(t => t.name === toolName);
        if (tool) {
          const toolNodeId = `${agent.id}-tool-${tool.id}`;
          
          // Only add tool node if not already added
          if (!newNodes.find(n => n.id === toolNodeId)) {
            newNodes.push({
              id: toolNodeId,
              type: 'toolNode',
              position: { 
                x: idx * nodeSpacing - 100 + (toolIdx * 80), 
                y: 300 
              },
              data: { 
                ...tool,
                isHighlighted: highlightedElements.has(tool.id)
              },
              sourcePosition: Position.Bottom,
              targetPosition: Position.Top,
            });
          }

          // Add edge from agent to tool
          newEdges.push({
            id: `${agent.id}-${toolNodeId}`,
            source: agent.id,
            target: toolNodeId,
            type: 'smoothstep',
            animated: highlightedElements.has(tool.id),
            style: { 
              stroke: '#10b981',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#10b981',
            },
          });
        }
      });
    });

    // Create edges for agent relationships
    agentData.relationships.forEach((rel) => {
      newEdges.push({
        id: rel.id,
        source: rel.from_agent_id,
        target: rel.to_agent_id,
        type: 'smoothstep',
        animated: highlightedElements.has(rel.id),
        label: rel.type,
        labelStyle: { 
          fill: '#ef4444',
          fontWeight: 600,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: '#1f2937',
          fillOpacity: 0.9,
        },
        style: { 
          stroke: '#ef4444',
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ef4444',
        },
        data: rel,
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agentData, highlightedElements, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    const data = node.data;
    
    if (node.type === 'agentNode') {
      setSelectedElement({ type: 'agent', data: data as Agent });
      setPanelView('details');
    } else if (node.type === 'toolNode') {
      setSelectedElement({ type: 'tool', data: data as Tool });
      setPanelView('details');
    }
  }, [setSelectedElement, setPanelView]);

  const onEdgeClick = useCallback((event: any, edge: Edge) => {
    if (edge.data) {
      setSelectedElement({ type: 'relationship', data: edge.data as Relationship });
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

  const nodeTypes = {
    agentNode: AgentNodeComponent,
    toolNode: ToolNodeComponent,
  };

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

// Agent Node Component - Large Block
function AgentNodeComponent({ data }: { data: any }) {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`px-6 py-4 rounded-xl border-2 transition-all cursor-pointer ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl scale-110 ring-4 ring-yellow-400/50'
          : 'border-primary/60 bg-card hover:border-primary hover:shadow-lg'
      }`}
      style={{ minWidth: '280px', minHeight: '120px' }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-primary">{data.name}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            Agent
          </span>
        </div>
        {data.tools && data.tools.length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="font-medium">{data.tools.length}</span> tools
          </div>
        )}
      </div>
    </div>
  );
}

// Tool Node Component - Small Block
function ToolNodeComponent({ data }: { data: any }) {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl scale-110 ring-4 ring-yellow-400/50'
          : 'border-green-500/60 bg-card hover:border-green-500 hover:shadow-md'
      }`}
      style={{ minWidth: '100px' }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 truncate max-w-full">
          {data.name}
        </span>
      </div>
    </div>
  );
}
