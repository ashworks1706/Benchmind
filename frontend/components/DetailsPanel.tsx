'use client';

import { useStore } from '@/lib/store';
import { ScrollArea } from './ui/ScrollArea';
import { Agent, Tool, Relationship, TestCase } from '@/types';
import { X, Save, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { apiService } from '@/lib/api';
import { calculateAgentCost, calculateToolCost, calculateConnectionCost, formatCost, getCostColor } from '@/lib/costCalculator';

// Cost Information Popup Component
function CostInfoPopup({ type }: { type: 'agent' | 'tool' | 'connection' }) {
  const [isOpen, setIsOpen] = useState(false);

  const getContent = () => {
    switch (type) {
      case 'agent':
        return {
          title: 'Agent Cost Calculation',
          sections: [
            {
              heading: '📊 Methodology',
              content: 'Agent costs are calculated based on LLM API usage, including both input and output tokens processed per interaction.'
            },
            {
              heading: '🔢 Formula',
              content: 'Total Cost = (Input Tokens × Input Price) + (Output Tokens × Output Price) × API Calls/Day',
              code: true
            },
            {
              heading: '💵 Model Pricing (per 1M tokens)',
              list: [
                'GPT-4: $30 input / $60 output',
                'GPT-4 Turbo: $10 input / $30 output',
                'Claude 3.5 Sonnet: $3 input / $15 output',
                'Claude 3 Haiku: $0.25 input / $1.25 output',
                'Gemini 1.5 Pro: $1.25 input / $5 output',
                'Gemini 1.5 Flash: $0.075 input / $0.30 output',
              ]
            },
            {
              heading: '📈 Assumptions',
              list: [
                'Avg. Input: 500 tokens (system prompt + user context)',
                'Avg. Output: 200 tokens (agent response)',
                'Est. API Calls: 10 per day (configurable)',
                'Token Estimation: ~4 characters per token',
              ]
            },
            {
              heading: '🎯 Accuracy Notes',
              content: 'These are estimates based on typical usage patterns. Actual costs may vary based on prompt complexity, response length, and call frequency. Monitor actual API usage for precise costs.'
            }
          ]
        };
      case 'tool':
        return {
          title: 'Tool Cost Calculation',
          sections: [
            {
              heading: '📊 Methodology',
              content: 'Tool costs represent execution overhead. Most tools don\'t make direct LLM calls, so costs are minimal compared to agents.'
            },
            {
              heading: '🔢 Formula',
              content: 'Total Cost = Execution Cost × Executions/Day',
              code: true
            },
            {
              heading: '💵 Cost Breakdown',
              list: [
                'Base Execution: $0.0001 per call',
                'No LLM token costs (unless tool uses AI)',
                'Est. Executions: 5 per day (typical)',
              ]
            },
            {
              heading: '⚡ Why So Low?',
              content: 'Tools are typically simple functions (database queries, API calls, calculations) that don\'t require expensive LLM inference. They\'re invoked by agents but don\'t generate text.'
            },
            {
              heading: '🎯 Exceptions',
              content: 'Some tools may integrate with external paid APIs or make their own LLM calls. In those cases, costs would be higher and should be factored separately.'
            }
          ]
        };
      case 'connection':
        return {
          title: 'Connection Cost Calculation',
          sections: [
            {
              heading: '📊 Methodology',
              content: 'Connection costs represent data transfer and coordination overhead between agents and tools.'
            },
            {
              heading: '🔢 Formula',
              content: 'Total Cost = (Data Transfer Cost + Coordination Overhead) × Calls/Day',
              code: true
            },
            {
              heading: '💵 Cost Breakdown',
              list: [
                'Data Transfer: $0.00005 per call',
                'Token Processing: Minimal (metadata only)',
                'Est. Calls: 10 per day (typical)',
              ]
            },
            {
              heading: '📡 What\'s Included',
              content: 'Costs include serialization/deserialization of data, inter-process communication overhead, and minimal token processing for routing and coordination logic.'
            },
            {
              heading: '🎯 Scale Considerations',
              content: 'At high volumes (1000+ calls/day), connection costs can become significant. Consider batching or optimizing data flow for high-frequency connections.'
            }
          ]
        };
    }
  };

  const content = getContent();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 p-0.5 rounded-full hover:bg-muted transition-colors"
        title="How is this cost calculated?"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popup */}
          <div className="absolute left-0 top-6 z-50 w-96 max-h-[500px] overflow-y-auto bg-background border-2 border-primary/20 rounded-lg shadow-2xl p-4">
            <div className="flex items-start justify-between mb-3 sticky top-0 bg-background pb-2 border-b">
              <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                🧮 {content.title}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 rounded hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {content.sections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <h5 className="font-semibold text-xs text-foreground">
                    {section.heading}
                  </h5>
                  {section.content && (
                    <p className={`text-xs text-muted-foreground leading-relaxed ${
                      section.code ? 'font-mono bg-muted/50 p-2 rounded' : ''
                    }`}>
                      {section.content}
                    </p>
                  )}
                  {section.list && (
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Color Legend */}
            <div className="mt-4 pt-3 border-t space-y-1">
              <h5 className="font-semibold text-xs text-foreground mb-2">🎨 Cost Color Coding</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">&lt; $0.01 (Low)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">$0.01-0.10 (Med)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground">$0.10-1.00 (High)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">&gt; $1.00 (V.High)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DetailsPanel() {
  const { selectedElement, setSelectedElement, agentData, addStatusMessage } = useStore();

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Click on an agent, tool, relationship, or test to view details
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
        {selectedElement.type === 'test' && (
          <TestDetails testCase={selectedElement.data as TestCase} />
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
  
  // Get repository info for GitHub link
  const repoInfo = agentData?.repository;
  const githubUrl = repoInfo ? `https://github.com/${repoInfo.owner}/${repoInfo.repo_name}/blob/master/${agent.file_path}` : null;
  
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
      
      {/* Code Location Section */}
      <div className="p-3 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
        <h5 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
          📍 Code Location
        </h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">File:</span>
            <code className="text-xs font-mono bg-background px-2 py-1 rounded">{agent.file_path}</code>
          </div>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              🔗 View on GitHub →
            </a>
          )}
        </div>
        {agent.code_snippet && (
          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Code Snippet:</label>
            <pre className="text-xs bg-background/80 p-2 rounded border border-border overflow-x-auto">
              <code className="language-python">{agent.code_snippet}</code>
            </pre>
          </div>
        )}
      </div>
      
      {/* Cost Analysis Section */}
      {(() => {
        const cost = calculateAgentCost(agent);
        return (
          <div className="p-3 rounded-lg border-2 border-green-500/30 bg-green-500/5">
            <h5 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2 flex items-center">
              💰 Cost Analysis
              <CostInfoPopup type="agent" />
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily Cost:</span>
                <span className={`text-sm font-mono font-semibold ${getCostColor(cost.totalCost)}`}>
                  {formatCost(cost.totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Monthly Cost:</span>
                <span className={`text-sm font-mono font-semibold ${getCostColor(cost.totalCost * 30)}`}>
                  {formatCost(cost.totalCost * 30)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Est. API Calls/Day:</span>
                <span className="text-sm font-mono">{cost.apiCalls}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Model:</span>
                <span className="text-xs font-mono bg-background px-2 py-0.5 rounded">
                  {agent.model_config.model}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Input Tokens:</span>
                <span className="text-xs font-mono">{cost.inputTokens}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Output Tokens:</span>
                <span className="text-xs font-mono">{cost.outputTokens}</span>
              </div>
            </div>
          </div>
        );
      })()}
      
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
  const { addStatusMessage, agentData } = useStore();
  
  // Get repository info for GitHub link
  const repoInfo = agentData?.repository;
  const githubUrl = repoInfo ? `https://github.com/${repoInfo.owner}/${repoInfo.repo_name}/blob/main/${tool.file_path}` : null;

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

      {/* Code Location Section */}
      <div className="p-3 rounded-lg border-2 border-green-500/30 bg-green-500/5">
        <h5 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
          📍 Code Location
        </h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">File:</span>
            <code className="text-xs font-mono bg-background px-2 py-1 rounded">{tool.file_path}</code>
          </div>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
            >
              🔗 View on GitHub →
            </a>
          )}
        </div>
      </div>

      {/* Cost Analysis Section */}
      {(() => {
        const cost = calculateToolCost(tool);
        return (
          <div className="p-3 rounded-lg border-2 border-green-500/30 bg-green-500/5">
            <h5 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2 flex items-center">
              💰 Cost Analysis
              <CostInfoPopup type="tool" />
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily Cost:</span>
                <span className={`text-sm font-mono font-semibold ${getCostColor(cost.totalCost)}`}>
                  {formatCost(cost.totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Monthly Cost:</span>
                <span className={`text-sm font-mono font-semibold ${getCostColor(cost.totalCost * 30)}`}>
                  {formatCost(cost.totalCost * 30)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Est. Executions/Day:</span>
                <span className="text-sm font-mono">{cost.apiCalls}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-background/50 rounded">
                💡 Tool costs are minimal (execution overhead only, no LLM calls)
              </div>
            </div>
          </div>
        );
      })()}

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
  
  // Calculate cost
  const cost = calculateConnectionCost(relationship);
  
  // Get repository info for GitHub links
  const repoInfo = agentData?.repository;
  const fromGithubUrl = repoInfo && fromAgent ? `https://github.com/${repoInfo.owner}/${repoInfo.repo_name}/blob/main/${fromAgent.file_path}` : null;
  const toGithubUrl = repoInfo && toAgent ? `https://github.com/${repoInfo.owner}/${repoInfo.repo_name}/blob/main/${toAgent.file_path}` : null;

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-semibold text-lg">Relationship</h4>

      <DetailSection label="Type" value={relationship.type} />
      <DetailSection label="Description" value={relationship.description} />
      <DetailSection label="Data Flow" value={relationship.data_flow} />
      
      {/* Cost Information */}
      <div className="p-3 rounded-lg border-2 border-green-500/30 bg-green-500/5">
        <h5 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
          💰 Cost Analysis
        </h5>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Daily Cost:</span>
            <span className={`font-bold ${getCostColor(cost.totalCost)}`}>
              {formatCost(cost.totalCost)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Monthly Cost:</span>
            <span className={`font-bold ${getCostColor(cost.totalCost * 30)}`}>
              {formatCost(cost.totalCost * 30)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Est. API Calls/Day:</span>
            <span className="font-semibold">{cost.apiCalls}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data Tokens:</span>
            <span className="font-semibold">{cost.inputTokens}</span>
          </div>
        </div>
      </div>
      
      {/* From Agent Location */}
      <div className="p-3 rounded-lg border-2 border-red-500/30 bg-red-500/5">
        <h5 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
          🔴 From Agent: {fromAgent?.name || 'Unknown'}
        </h5>
        {fromAgent && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">File:</span>
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">{fromAgent.file_path}</code>
            </div>
            {fromGithubUrl && (
              <a
                href={fromGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                🔗 View on GitHub →
              </a>
            )}
            {fromAgent.code_snippet && (
              <div className="mt-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Code:</label>
                <pre className="text-xs bg-background/80 p-2 rounded border border-border overflow-x-auto max-h-32">
                  <code className="language-python">{fromAgent.code_snippet}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Connection Indicator */}
      <div className="flex items-center justify-center text-2xl">
        ⬇️
      </div>
      
      {/* To Agent Location */}
      <div className="p-3 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
        <h5 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
          🔵 To Agent: {toAgent?.name || 'Unknown'}
        </h5>
        {toAgent && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">File:</span>
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">{toAgent.file_path}</code>
            </div>
            {toGithubUrl && (
              <a
                href={toGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                🔗 View on GitHub →
              </a>
            )}
            {toAgent.code_snippet && (
              <div className="mt-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Code:</label>
                <pre className="text-xs bg-background/80 p-2 rounded border border-border overflow-x-auto max-h-32">
                  <code className="language-python">{toAgent.code_snippet}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TestDetails({ testCase }: { testCase: TestCase }) {
  const { testResults, agentData } = useStore();
  const result = testResults.get(testCase.id);

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-gray-500';
    if (status === 'passed') return 'text-green-600 dark:text-green-400';
    if (status === 'failed') return 'text-red-600 dark:text-red-400';
    if (status === 'warning') return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-500';
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return '⏸️';
    if (status === 'passed') return '✅';
    if (status === 'failed') return '❌';
    if (status === 'warning') return '⚠️';
    return '❓';
  };

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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          {getCategoryIcon(testCase.category)}
          Test Case
        </h4>
        {result && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-muted ${getStatusColor(result.status)}`}>
            <span>{getStatusIcon(result.status)}</span>
            <span className="text-sm font-semibold capitalize">{result.status}</span>
          </div>
        )}
      </div>

      <DetailSection label="Name" value={testCase.name} />
      <DetailSection label="Category" value={testCase.category} />
      <DetailSection label="Description" value={testCase.description} />
      
      <div>
        <label className="text-sm font-medium text-muted-foreground">Target</label>
        <div className="mt-1 p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">{testCase.target.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{testCase.target.type}</p>
        </div>
      </div>

      <DetailSection label="Test Input" value={testCase.test_input} />
      <DetailSection label="Expected Behavior" value={testCase.expected_behavior} />
      <DetailSection label="Success Criteria" value={testCase.success_criteria} />

      {testCase.metrics && testCase.metrics.length > 0 && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Metrics</label>
          <div className="mt-1 space-y-2">
            {testCase.metrics.map((metric, idx) => (
              <div key={idx} className="p-2 bg-muted rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  {metric.value !== undefined && (
                    <span className={`text-sm font-semibold ${metric.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.value} {metric.unit}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="border-t border-border pt-4">
            <h5 className="font-semibold text-md mb-3">Test Results</h5>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Summary</label>
              <p className="mt-1 text-sm">{result.results.summary}</p>
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-muted-foreground">Details</label>
              <p className="mt-1 text-sm">{result.results.details}</p>
            </div>

            {result.results.issues_found && result.results.issues_found.length > 0 && (
              <div className="mt-3">
                <label className="text-sm font-medium text-muted-foreground">Issues Found</label>
                <ul className="mt-1 space-y-1">
                  {result.results.issues_found.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                      <span>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.execution_time && (
              <div className="mt-3">
                <label className="text-sm font-medium text-muted-foreground">Execution Time</label>
                <p className="mt-1 text-sm">{result.execution_time.toFixed(2)}s</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && (
        <div className="p-3 bg-muted rounded-md text-center">
          <p className="text-sm text-muted-foreground">Test not yet executed</p>
        </div>
      )}
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
