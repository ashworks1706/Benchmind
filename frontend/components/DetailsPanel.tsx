'use client';

import { useStore } from '@/lib/store';
import { ScrollArea } from './ui/ScrollArea';
import { Agent, Tool, Relationship } from '@/types';
import { X, Save } from 'lucide-react';
import { useState } from 'react';
import { apiService } from '@/lib/api';

export function DetailsPanel() {
  const { selectedElement, setSelectedElement, agentData, addStatusMessage } = useStore();

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Click on an agent, tool, or relationship to view details
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Details</h3>
        <button
          onClick={() => setSelectedElement(null)}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {selectedElement.type === 'agent' && (
          <AgentDetails agent={selectedElement.data as Agent} />
        )}
        {selectedElement.type === 'tool' && (
          <ToolDetails tool={selectedElement.data as Tool} />
        )}
        {selectedElement.type === 'relationship' && (
          <RelationshipDetails relationship={selectedElement.data as Relationship} />
        )}
      </ScrollArea>
    </div>
  );
}

function AgentDetails({ agent }: { agent: Agent }) {
  const [editing, setEditing] = useState(false);
  const { agentData, addStatusMessage, testingStatus, testReport, errorHighlightedElements, addQueuedChange } = useStore();
  const [editedAgent, setEditedAgent] = useState(agent);

  const isTestingActive = testingStatus === 'running_tests' || testingStatus === 'generating';
  const hasErrors = errorHighlightedElements.has(agent.id);
  
  // Find errors related to this agent from test report
  const agentErrors = testReport?.test_results?.filter((result: any) => {
    const testCase = testReport.test_cases?.find((tc: any) => tc.id === result.test_id);
    return (result.status === 'failed' || result.status === 'warning') && 
           testCase?.highlight_elements?.includes(agent.id);
  }) || [];

  const handleSave = async () => {
    try {
      // Queue the change instead of applying immediately
      addQueuedChange({
        type: 'edit',
        description: `Update agent: ${agent.name}`,
        data: { agentId: agent.id, updates: editedAgent },
      });
      
      addStatusMessage({
        type: 'success',
        message: `Queued update for agent: ${agent.name}`,
      });
      setEditing(false);
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to update agent: ${error.message}`,
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Error Banner */}
      {hasErrors && agentErrors.length > 0 && (
        <div className="p-3 rounded-lg border-2 border-red-500/50 bg-red-500/10">
          <h5 className="font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
            ⚠️ Test Failures Detected
          </h5>
          <div className="space-y-2">
            {agentErrors.map((error: any, idx: number) => (
              <div key={idx} className="text-sm p-2 bg-background/50 rounded">
                <p className="font-medium">{error.results?.summary}</p>
                {error.results?.issues_found && error.results.issues_found.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground">
                    {error.results.issues_found.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">{agent.name}</h4>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          disabled={isTestingActive}
          className={`px-3 py-1 rounded-md text-sm flex items-center gap-2 ${
            isTestingActive 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Save className="w-4 h-4" />
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>
      
      {isTestingActive && (
        <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            🔒 Editing disabled during testing
          </p>
        </div>
      )}

      <DetailSection label="Type" value={agent.type} />
      <DetailSection label="File Path" value={agent.file_path} />

      <div>
        <label className="text-sm font-medium text-muted-foreground">Prompt</label>
        {editing ? (
          <textarea
            value={editedAgent.prompt}
            onChange={(e) =>
              setEditedAgent({ ...editedAgent, prompt: e.target.value })
            }
            disabled={isTestingActive}
            className="w-full mt-1 p-2 border border-border rounded-md bg-background text-sm disabled:opacity-50"
            rows={4}
          />
        ) : (
          <p className="mt-1 text-sm">{agent.prompt}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">System Instruction</label>
        {editing ? (
          <textarea
            value={editedAgent.system_instruction}
            onChange={(e) =>
              setEditedAgent({ ...editedAgent, system_instruction: e.target.value })
            }
            disabled={isTestingActive}
            className="w-full mt-1 p-2 border border-border rounded-md bg-background text-sm disabled:opacity-50"
            rows={4}
          />
        ) : (
          <p className="mt-1 text-sm">{agent.system_instruction}</p>
        )}
      </div>

      <DetailSection label="Objective" value={agent.objective} />

      <div>
        <label className="text-sm font-medium text-muted-foreground">Model Configuration</label>
        <div className="mt-1 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Model:</span>
            <span>{agent.model_config.model}</span>
          </div>
          <div className="flex justify-between">
            <span>Temperature:</span>
            {editing ? (
              <input
                type="number"
                step="0.1"
                value={editedAgent.model_config.temperature}
                onChange={(e) =>
                  setEditedAgent({
                    ...editedAgent,
                    model_config: {
                      ...editedAgent.model_config,
                      temperature: parseFloat(e.target.value),
                    },
                  })
                }
                disabled={isTestingActive}
                className="w-20 px-2 py-0.5 border border-border rounded bg-background disabled:opacity-50"
              />
            ) : (
              <span>{agent.model_config.temperature}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>Max Tokens:</span>
            {editing ? (
              <input
                type="number"
                value={editedAgent.model_config.max_tokens}
                onChange={(e) =>
                  setEditedAgent({
                    ...editedAgent,
                    model_config: {
                      ...editedAgent.model_config,
                      max_tokens: parseInt(e.target.value),
                    },
                  })
                }
                disabled={isTestingActive}
                className="w-20 px-2 py-0.5 border border-border rounded bg-background disabled:opacity-50"
              />
            ) : (
              <span>{agent.model_config.max_tokens}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">Tools ({agent.tools.length})</label>
        <ul className="mt-1 text-sm space-y-1">
          {agent.tools.map((tool, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ToolDetails({ tool }: { tool: Tool }) {
  const [editing, setEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(tool.code);
  const { addStatusMessage } = useStore();

  const handleSave = async () => {
    try {
      await apiService.updateAgent(tool.id, { code: editedCode });
      addStatusMessage({
        type: 'success',
        message: `Updated tool: ${tool.name}`,
      });
      setEditing(false);
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `Failed to update tool: ${error.message}`,
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">{tool.name}</h4>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>

      <DetailSection label="File Path" value={tool.file_path} />
      <DetailSection label="Description" value={tool.description} />
      <DetailSection label="Summary" value={tool.summary} />
      <DetailSection label="Return Type" value={tool.return_type} />

      <div>
        <label className="text-sm font-medium text-muted-foreground">Parameters</label>
        <ul className="mt-1 text-sm space-y-1">
          {tool.parameters.map((param, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                {param.name}: {param.type}
              </span>
              <span className="text-muted-foreground">{param.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">Code</label>
        {editing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full mt-1 p-2 border border-border rounded-md bg-background text-xs font-mono"
            rows={12}
          />
        ) : (
          <pre className="mt-1 text-xs bg-muted p-3 rounded-md overflow-x-auto">
            <code>{tool.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function RelationshipDetails({ relationship }: { relationship: Relationship }) {
  const { agentData } = useStore();

  const fromAgent = agentData?.agents.find((a) => a.id === relationship.from_agent_id);
  const toAgent = agentData?.agents.find((a) => a.id === relationship.to_agent_id);

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-semibold text-lg">Relationship</h4>

      <DetailSection label="Type" value={relationship.type} />
      <DetailSection label="From Agent" value={fromAgent?.name || 'Unknown'} />
      <DetailSection label="To Agent" value={toAgent?.name || 'Unknown'} />
      <DetailSection label="Description" value={relationship.description} />
      <DetailSection label="Data Flow" value={relationship.data_flow} />
    </div>
  );
}

function DetailSection({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
