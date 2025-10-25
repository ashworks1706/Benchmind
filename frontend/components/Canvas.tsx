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
  MiniMap,
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
    const agentSpacing = 800; // Increased horizontal spacing between agents
    const toolOffsetY = 350; // Increased vertical offset for tools below agents
    const toolSpacing = 200; // Increased horizontal spacing between tools

    // Create agent nodes in a horizontal row
    agentData.agents.forEach((agent, idx) => {
      newNodes.push({
        id: agent.id,
        type: 'agentNode',
        position: { x: idx * agentSpacing, y: 100 },
        data: { 
          ...agent,
          isHighlighted: highlightedElements.has(agent.id)
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      // Create tool nodes below each agent
      const agentTools = agent.tools.map(toolName => 
        agentData.tools.find(t => t.name === toolName)
      ).filter(Boolean);

      agentTools.forEach((tool, toolIdx) => {
        if (tool) {
          const toolNodeId = `${agent.id}-tool-${tool.id}`;
          
          // Calculate tool position: centered under agent, spread horizontally
          const totalToolsWidth = (agentTools.length - 1) * toolSpacing;
          const startX = idx * agentSpacing - totalToolsWidth / 2;
          
          newNodes.push({
            id: toolNodeId,
            type: 'toolNode',
            position: { 
              x: startX + (toolIdx * toolSpacing), 
              y: 100 + toolOffsetY 
            },
            data: { 
              ...tool,
              isHighlighted: highlightedElements.has(tool.id)
            },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          });

          // Add edge from agent to tool (green, vertical)
          newEdges.push({
            id: `${agent.id}-${toolNodeId}`,
            source: agent.id,
            target: toolNodeId,
            type: 'smoothstep',
            animated: highlightedElements.has(tool.id),
            style: { 
              stroke: '#10b981',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#10b981',
              width: 25,
              height: 25,
            },
          });
        }
      });
    });

    // Create edges for agent relationships (horizontal, red)
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
          fontWeight: 700,
          fontSize: 14,
        },
        labelBgStyle: {
          fill: '#1f2937',
          fillOpacity: 0.95,
        },
        style: { 
          stroke: '#ef4444',
          strokeWidth: 4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ef4444',
          width: 30,
          height: 30,
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
    <div className="h-full w-full animate-in fade-in duration-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          includeHiddenNodes: false,
          minZoom: 0.3,
          maxZoom: 1.2,
          duration: 800,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        className="bg-muted/30"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
      >
        <Background 
          gap={16} 
          size={1}
          color="#333"
          className="opacity-30"
        />
        <Controls 
          className="bg-background border border-border rounded-lg shadow-lg"
          showInteractive={false}
        />
        <MiniMap 
          className="bg-background border border-border rounded-lg shadow-lg"
          nodeColor={(node) => {
            if (node.type === 'agentNode') return '#3b82f6';
            if (node.type === 'toolNode') return '#10b981';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          nodeStrokeWidth={3}
        />
          <MiniMap nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  );
}

// Agent Node Component - Simplified with minimal info
function AgentNodeComponent({ data }: { data: any }) {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`group px-5 py-4 rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl scale-110 ring-4 ring-yellow-400/50 animate-pulse'
          : 'border-blue-500/60 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 hover:border-blue-500 hover:scale-105'
      }`}
      style={{ 
        minWidth: '200px',
        backdropFilter: 'blur(10px)',
      }}
    >
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
    </div>
  );
}

// Tool Node Component - Simplified minimal display
function ToolNodeComponent({ data }: { data: any }) {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`group px-3 py-2.5 rounded-lg border-2 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl scale-110 ring-4 ring-yellow-400/50 animate-pulse'
          : 'border-green-500/60 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 hover:border-green-500 hover:scale-105'
      }`}
      style={{ 
        minWidth: '120px',
        maxWidth: '140px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
          🔧
        </div>
        <span className="text-xs font-semibold text-green-700 dark:text-green-300 text-center line-clamp-2 leading-tight">
          {data.name}
        </span>
      </div>
    </div>
  );
}
