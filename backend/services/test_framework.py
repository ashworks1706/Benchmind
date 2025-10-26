
import json
from typing import Dict, List, Any
import time
import google.generativeai as genai
from config import Config
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

genai.configure(api_key=Config.GEMINI_API_KEY)

class TestFrameworkGenerator:
    """
    AI agent that generates a custom testing framework based on the codebase
    """
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_framework(self, agent_data: Dict[str, Any], progress_callback=None) -> Dict[str, Any]:
        """
        Generate a custom testing framework tailored to this specific agent system
        
        Args:
            agent_data: Complete agent system configuration
            progress_callback: Optional callback for progress updates
            
        Returns:
            Custom framework definition with test strategies
        """
        if progress_callback:
            progress_callback("status", {
                "message": "🤖 AI analyzing codebase structure...",
                "progress": 5
            })
        
        agents = agent_data.get('agents', [])
        tools = agent_data.get('tools', [])
        relationships = agent_data.get('relationships', [])
        
        prompt = f"""
You are a Testing Framework Architect AI. Your job is to create a CUSTOM, DISTILLED testing framework specifically designed for this AI agent system.

CRITICAL: This framework should create a LIGHTWEIGHT, FILTERED MODEL ENVIRONMENT that simulates the codebase WITHOUT executing actual code. Think of it as creating a "testing sandbox" that captures the essence of the system while being optimized for rapid testing.

Agent System Overview:
- {len(agents)} agents with specific roles and capabilities
- {len(tools)} tools with defined interfaces
- {len(relationships)} inter-agent relationships and dependencies

Agent Details (Top 5):
{json.dumps(agents[:5], indent=2)}

Tool Details (Top 5):
{json.dumps(tools[:5], indent=2)}

Relationships:
{json.dumps(relationships, indent=2)}

YOUR TASK: Design a research-grade testing framework that:

1. **Creates a Distilled Model Environment**:
   - Abstract away implementation details
   - Focus on agent behavior patterns, not code execution
   - Mock agent responses based on their prompts/configurations
   - Simulate tool outputs based on their descriptions

2. **Contextual to THIS Specific Codebase**:
   - Use actual agent names, tool names, and relationships from above
   - Tailor test scenarios to the specific domain of these agents
   - Generate realistic mock data relevant to this system's use cases

3. **Research-Level Benchmarks**:
   - Set benchmarks based on academic research (LangChain, AutoGPT, AutoGen studies)
   - Include industry-standard metrics (response time < 500ms, accuracy > 90%)
   - Reference actual research papers for credibility

4. **Lightweight & Fast**:
   - No actual code execution required
   - All tests run in simulation mode
   - Complete test suite should execute in < 30 seconds

Return as JSON:
{{
    "framework_name": "Custom name based on the system (e.g., 'CustomerSupportAgent-TestFramework')",
    "version": "1.0",
    "description": "Brief description of what this system does and how this framework tests it",
    "distillation_strategy": {{
        "approach": "Explain how you're creating a simplified model of the system",
        "key_abstractions": ["List", "the", "main", "abstractions"],
        "simulation_depth": "shallow|medium|deep - how deep to simulate"
    }},
    "agent_simulation": {{
        "strategy": "Detailed strategy for simulating agent behavior WITHOUT running code",
        "mock_response_generation": {{
            "based_on_prompt": "How to generate responses from agent prompts",
            "based_on_role": "How agent roles influence behavior",
            "example_responses": {{
                "{agents[0].get('name', 'agent1') if agents else 'agent1'}": [
                    "Example response 1",
                    "Example response 2"
                ]
            }}
        }},
        "execution_steps": [
            "Step 1: Parse agent configuration",
            "Step 2: Generate mock context",
            "Step 3: Simulate reasoning process",
            "Step 4: Return simulated output"
        ]
    }},
    "tool_mocking": {{
        "strategy": "How to mock tool calls without executing actual functions",
        "contextual_mocks": {{
            "{tools[0].get('name', 'tool1') if tools else 'tool1'}": {{
                "description": "{tools[0].get('description', 'A tool') if tools else 'A tool'}",
                "mock_input_example": "Realistic input for this specific tool",
                "mock_output_example": "Realistic output based on tool's purpose",
                "execution_time_ms": 50,
                "success_rate": 0.95
            }}
        }}
    }},
    "test_categories": [
        {{
            "name": "tool_calling",
            "description": "Tests tool selection accuracy for THIS specific system",
            "benchmark": 95,
            "unit": "%",
            "research_basis": "ReAct: Synergizing Reasoning and Acting (Yao et al., 2023)",
            "test_strategy": "Simulate scenarios where agents must choose between available tools",
            "relevant_agents": ["{agents[0].get('name', 'agent1') if agents else 'agent1'}"],
            "sample_test_scenarios": [
                "Scenario 1 specific to this system",
                "Scenario 2 specific to this system"
            ]
        }},
        {{
            "name": "reasoning",
            "description": "Evaluates chain-of-thought quality in THIS system's context",
            "benchmark": 85,
            "unit": "%",
            "research_basis": "Chain-of-Thought Prompting (Wei et al., 2022)",
            "test_strategy": "Analyze simulated reasoning patterns",
            "relevant_agents": ["all"],
            "sample_test_scenarios": ["Complex reasoning scenario for this domain"]
        }},
        {{
            "name": "response_time",
            "description": "Performance benchmarks for THIS system",
            "benchmark": 500,
            "unit": "ms",
            "research_basis": "OpenAI/Anthropic Production Guidelines",
            "test_strategy": "Simulate latency based on agent complexity",
            "relevant_agents": ["all"]
        }}
    ],
    "performance_benchmarks": {{
        "response_time_ms": 500,
        "tool_accuracy_percent": 90,
        "reasoning_score": 85,
        "collaboration_efficiency": 85,
        "throughput_requests_per_second": 10
    }},
    "stress_test_config": {{
        "max_concurrent_agents": {min(len(agents) * 2, 20)},
        "test_duration_seconds": 10,
        "failure_injection_rate": 0.1
    }},
    "relationship_testing": {{
        "strategy": "How to test inter-agent communication in simulation",
        "test_flows": [
            {{
                "name": "End-to-end flow test",
                "agents_involved": ["{agents[0].get('name', 'agent1') if agents else 'agent1'}"],
                "expected_outcome": "Description of expected behavior"
            }}
        ]
    }}
}}

REMEMBER: This is a DISTILLED, FILTERED testing environment - NOT actual code execution. Everything is simulated based on configurations and descriptions.
"""
        
        try:
            if progress_callback:
                progress_callback("status", {
                    "message": "🧠 AI designing custom testing framework...",
                    "progress": 15
                })
            
            # Use ThreadPoolExecutor for timeout
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self.model.generate_content, prompt)
                try:
                    response = future.result(timeout=50)  # 20 second timeout
                    text = response.text.strip()
                except FuturesTimeoutError:
                    print("Framework generation timed out after 20 seconds")
                    if progress_callback:
                        progress_callback("status", {
                            "message": "⚠️ AI timed out, using default framework...",
                            "progress": 20
                        })
                    return self._get_fallback_framework(agent_data)
            
            # Extract JSON
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                framework = json.loads(json_match.group())
                
                if progress_callback:
                    progress_callback("status", {
                        "message": f"✅ Custom framework '{framework.get('framework_name', 'Testing Framework')}' created!",
                        "progress": 25
                    })
                
                return framework
            
            # Fallback framework
            return self._get_fallback_framework(agent_data)
            
        except Exception as e:
            print(f"Error generating framework: {str(e)}")
            return self._get_fallback_framework(agent_data)
    
    def _get_fallback_framework(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a basic fallback framework if AI generation fails"""
        return {
            "framework_name": "Generic Agent Testing Framework",
            "version": "1.0",
            "agent_simulation": {
                "strategy": "Configuration-based simulation",
                "execution_steps": ["Load config", "Simulate execution", "Return results"]
            },
            "tool_mocking": {
                "strategy": "Mock all tool calls with success responses"
            },
            "test_categories": [
                {"name": "tool_calling", "benchmark": 95},
                {"name": "reasoning", "benchmark": 85},
                {"name": "performance", "benchmark": 90}
            ],
            "performance_benchmarks": {
                "response_time_ms": 500,
                "tool_accuracy_pct": 95
            }
        }


class AgentTestFramework:
    """
    Executes tests using the dynamically generated framework
    """
    
    def __init__(self, agent_data: Dict[str, Any], framework_definition: Dict[str, Any]):
        """
        Initialize with agent data and custom framework definition
        
        Args:
            agent_data: Complete agent system configuration
            framework_definition: Custom framework generated by TestFrameworkGenerator
        """
        self.agents = {agent['id']: agent for agent in agent_data.get('agents', [])}
        self.tools = {tool['id']: tool for tool in agent_data.get('tools', [])}
        self.relationships = agent_data.get('relationships', [])
        self.framework = framework_definition
        
        # Build execution graph
        self.agent_graph = self._build_execution_graph()
        
    def _build_execution_graph(self) -> Dict[str, Any]:
        """Build a graph of agent interactions for quick lookup"""
        graph = {}
        
        for rel in self.relationships:
            from_id = rel.get('from_agent_id')
            to_id = rel.get('to_agent_id')
            
            if from_id not in graph:
                graph[from_id] = {'calls': [], 'called_by': []}
            if to_id not in graph:
                graph[to_id] = {'calls': [], 'called_by': []}
                
            graph[from_id]['calls'].append({
                'agent_id': to_id,
                'relationship': rel
            })
            graph[to_id]['called_by'].append({
                'agent_id': from_id,
                'relationship': rel
            })
        
        return graph
    
    def simulate_agent_execution(self, agent_id: str, test_input: str) -> Dict[str, Any]:
        """
        Simulate agent execution without running actual code
        
        Args:
            agent_id: ID of the agent to test
            test_input: Test input scenario
            
        Returns:
            Simulation results with metrics
        """
        if agent_id not in self.agents:
            return {'error': 'Agent not found', 'success': False}
        
        agent = self.agents[agent_id]
        start_time = time.time()
        
        # Simulate execution based on agent configuration
        simulation = {
            'agent_id': agent_id,
            'agent_name': agent['name'],
            'input': test_input,
            'success': True,
            'execution_time': 0,
            'steps': [],
            'metrics': {}
        }
        
        # Step 1: Check prompt and system instruction
        simulation['steps'].append({
            'step': 'initialization',
            'message': f"Agent '{agent['name']}' initialized with prompt",
            'status': 'passed'
        })
        
        # Step 2: Validate tools
        agent_tools = agent.get('tools', [])
        available_tools = [tid for tid in self.tools.keys() if any(tool_name in tid or tool_name in self.tools[tid].get('name', '') for tool_name in agent_tools)]
        
        simulation['steps'].append({
            'step': 'tool_validation',
            'message': f"Validated {len(available_tools)} tools",
            'tools': available_tools,
            'status': 'passed' if len(available_tools) > 0 else 'warning'
        })
        
        # Step 3: Check model configuration
        model_config = agent.get('model_config', {})
        temp = model_config.get('temperature', 0.7)
        max_tokens = model_config.get('max_tokens', 1000)
        
        config_valid = 0 <= temp <= 2 and max_tokens > 0
        simulation['steps'].append({
            'step': 'config_validation',
            'message': f"Model config validated (temp={temp}, max_tokens={max_tokens})",
            'status': 'passed' if config_valid else 'failed'
        })
        
        # Step 4: Simulate tool calls
        if available_tools:
            for tool_id in available_tools[:2]:  # Test first 2 tools
                tool = self.tools.get(tool_id, {})
                simulation['steps'].append({
                    'step': 'tool_execution',
                    'tool_name': tool.get('name', tool_id),
                    'message': f"Simulated call to {tool.get('name', tool_id)}",
                    'status': 'passed'
                })
        
        # Step 5: Check relationships
        if agent_id in self.agent_graph:
            relationships = self.agent_graph[agent_id]
            if relationships['calls']:
                simulation['steps'].append({
                    'step': 'agent_collaboration',
                    'message': f"Can collaborate with {len(relationships['calls'])} agents",
                    'collaborators': [c['agent_id'] for c in relationships['calls']],
                    'status': 'passed'
                })
        
        # Calculate metrics
        execution_time = (time.time() - start_time) * 1000  # Convert to ms
        simulation['execution_time'] = execution_time
        
        # Metrics based on simulation
        simulation['metrics'] = {
            'response_time': execution_time,
            'tool_accuracy': len(available_tools) / max(len(agent_tools), 1) * 100,
            'config_validity': 100 if config_valid else 50,
            'collaboration_score': len(self.agent_graph.get(agent_id, {}).get('calls', [])) * 20
        }
        
        return simulation
    
    def run_stress_test(self, agent_id: str, num_iterations: int = 10) -> Dict[str, Any]:
        """
        Run stress test on an agent
        
        Args:
            agent_id: Agent to stress test
            num_iterations: Number of test iterations
            
        Returns:
            Stress test results
        """
        results = {
            'agent_id': agent_id,
            'iterations': num_iterations,
            'response_times': [],
            'success_rate': 0,
            'average_time': 0
        }
        
        successes = 0
        for i in range(num_iterations):
            test_input = f"Stress test input #{i+1}"
            sim_result = self.simulate_agent_execution(agent_id, test_input)
            
            if sim_result.get('success'):
                successes += 1
                results['response_times'].append(sim_result['execution_time'])
        
        results['success_rate'] = (successes / num_iterations) * 100
        if results['response_times']:
            results['average_time'] = sum(results['response_times']) / len(results['response_times'])
        
        return results
    
    def test_tool_calling(self, agent_id: str, tool_name: str) -> Dict[str, Any]:
        """
        Test if an agent can correctly call a specific tool
        
        Args:
            agent_id: Agent ID
            tool_name: Tool name to test
            
        Returns:
            Test results
        """
        if agent_id not in self.agents:
            return {'error': 'Agent not found', 'passed': False}
        
        agent = self.agents[agent_id]
        agent_tools = agent.get('tools', [])
        
        # Check if tool is in agent's tool list
        has_tool = tool_name in agent_tools or any(tool_name in tool for tool in agent_tools)
        
        # Find actual tool definition
        tool_def = None
        for tid, tool in self.tools.items():
            if tool_name in tool.get('name', '') or tool_name in tid:
                tool_def = tool
                break
        
        result = {
            'agent_id': agent_id,
            'tool_name': tool_name,
            'has_tool': has_tool,
            'tool_exists': tool_def is not None,
            'passed': has_tool and tool_def is not None
        }
        
        if tool_def:
            result['tool_description'] = tool_def.get('description', '')
            result['tool_parameters'] = tool_def.get('parameters', [])
        
        return result
    
    def test_reasoning(self, agent_id: str, scenario: str) -> Dict[str, Any]:
        """
        Test agent reasoning capability
        
        Args:
            agent_id: Agent ID
            scenario: Test scenario
            
        Returns:
            Reasoning test results
        """
        if agent_id not in self.agents:
            return {'error': 'Agent not found', 'passed': False}
        
        agent = self.agents[agent_id]
        
        # Evaluate based on prompt quality and system instruction
        prompt = agent.get('prompt', '')
        system_instruction = agent.get('system_instruction', '')
        
        # Scoring criteria
        has_clear_objective = len(agent.get('objective', '')) > 10
        has_detailed_prompt = len(prompt) > 50
        has_system_instruction = len(system_instruction) > 20
        
        reasoning_score = 0
        if has_clear_objective:
            reasoning_score += 30
        if has_detailed_prompt:
            reasoning_score += 40
        if has_system_instruction:
            reasoning_score += 30
        
        return {
            'agent_id': agent_id,
            'scenario': scenario,
            'reasoning_score': reasoning_score,
            'has_clear_objective': has_clear_objective,
            'has_detailed_prompt': has_detailed_prompt,
            'has_system_instruction': has_system_instruction,
            'passed': reasoning_score >= 70
        }
