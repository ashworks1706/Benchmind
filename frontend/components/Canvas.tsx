'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '@/lib/store';
import { Agent, Tool } from '@/types';
import { Bot, Wrench } from 'lucide-react';

export function Canvas() {
  const { agentData, isLoading, loadingMessage, highlightedElements, setSelectedElement, setPanelView } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build graph from agent data
  useEffect(() => {
    if (!agentData) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create agent nodes
    agentData.agents.forEach((agent, idx) => {
      newNodes.push({
        id: agent.id,
        type: 'custom',
        position: { x: 250 * idx, y: 100 },
        data: { 
          ...agent, 
          type: 'agent',
          isHighlighted: highlightedElements.has(agent.id)
        },
      });

      // Create edges to tools
      agent.tools.forEach((toolName) => {
        const tool = agentData.tools.find(t => t.name === toolName);
        if (tool) {
          // Add tool node if not already added
          if (!newNodes.find(n => n.id === tool.id)) {
            newNodes.push({
              id: tool.id,
              type: 'custom',
              position: { x: 250 * idx, y: 300 },
              data: { 
                ...tool, 
                type: 'tool',
                isHighlighted: highlightedElements.has(tool.id)
              },
            });
          }

          // Add edge from agent to tool
          newEdges.push({
            id: `${agent.id}-${tool.id}`,
            source: agent.id,
            target: tool.id,
            type: 'smoothstep',
            animated: highlightedElements.has(tool.id),
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
      });
    });

    // Create edges for relationships
    agentData.relationships.forEach((rel) => {
      newEdges.push({
        id: rel.id,
        source: rel.from_agent_id,
        target: rel.to_agent_id,
        type: 'smoothstep',
        animated: highlightedElements.has(rel.id),
        label: rel.type,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { stroke: '#22c55e' },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agentData, highlightedElements, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    const data = node.data;
    if (data.type === 'agent') {
      setSelectedElement({ type: 'agent', data: data as Agent });
    } else if (data.type === 'tool') {
      setSelectedElement({ type: 'tool', data: data as Tool });
    }
    setPanelView('both');
  }, [setSelectedElement, setPanelView]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-lg border-2 border-primary bg-primary/10 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p className="text-muted-foreground animate-pulse">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={{ custom: CustomNode }}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function CustomNode({ data }: { data: any }) {
  const isAgent = data.type === 'agent';
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg scale-110'
          : 'border-border bg-card hover:border-primary'
      }`}
      style={{ minWidth: '200px' }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isAgent ? (
          <Bot className="w-5 h-5 text-primary" />
        ) : (
          <Wrench className="w-5 h-5 text-blue-500" />
        )}
        <span className="font-semibold text-sm">{data.name}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {isAgent ? data.objective : data.summary}
      </p>
    </div>
  );
}
