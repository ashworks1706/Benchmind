import json
import google.generativeai as genai
from typing import Dict, List, Any
from config import Config

genai.configure(api_key=Config.GEMINI_API_KEY)

class TestGenerator:
    """Service for generating and running test cases for AI agents"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
    def generate_test_cases(self, agent_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate test cases for the analyzed agents
        
        Args:
            agent_data: Structured agent data with configurations
            
        Returns:
            List of test case objects
        """
        agents = agent_data.get('agents', [])
        tools = agent_data.get('tools', [])
        relationships = agent_data.get('relationships', [])
        
        prompt = f"""
Generate {Config.MAX_TEST_CASES} comprehensive test cases for testing AI agents in a LangChain-based system.

Agent Information:
{json.dumps(agents, indent=2)}

Tools:
{json.dumps(tools, indent=2)}

Relationships:
{json.dumps(relationships, indent=2)}

For each test case, create tests that cover:
1. **Hyperparameter Testing**: Test different temperature, max_tokens, and other model parameters
2. **Prompt Injection Testing**: Test for prompt injection vulnerabilities and edge cases
3. **Tool Calling Accuracy**: Verify agents call the correct tools with proper parameters
4. **Relationship Validation**: Test agent-to-agent communication and data flow
5. **Collaborative Behavior**: Test how agents work together on complex tasks
6. **Error Handling**: Test agent behavior with invalid inputs or tool failures
7. **Output Quality**: Evaluate response quality and relevance
8. **Performance**: Test response time and resource usage
9. **Edge Cases**: Test boundary conditions and unusual inputs
10. **Security**: Test for potential security vulnerabilities

Return as JSON array with this structure:
[{{
    "id": "test_case_id",
    "name": "Test Case Name",
    "category": "hyperparameter|prompt_injection|tool_calling|relationship|collaborative|error_handling|output_quality|performance|edge_case|security",
    "description": "Detailed test description",
    "target": {{
        "type": "agent|tool|relationship",
        "id": "target_id",
        "name": "target_name"
    }},
    "test_input": "input or scenario to test",
    "expected_behavior": "what should happen",
    "success_criteria": "how to determine if test passes",
    "highlight_elements": ["element_ids_to_highlight_during_test"]
}}]

Make tests specific to the actual agents and tools found in the codebase.
"""
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                test_cases = json.loads(json_match.group())
                return test_cases[:Config.MAX_TEST_CASES]
            
            return []
            
        except Exception as e:
            print(f"Error generating test cases: {str(e)}")
            return []
    
    def run_test(self, test_case: Dict[str, Any], agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run a specific test case
        
        Args:
            test_case: Test case to run
            agent_data: Agent configuration data
            
        Returns:
            Test result with pass/fail status and details
        """
        
        # Find target agent/tool
        target = test_case.get('target', {})
        target_type = target.get('type')
        target_id = target.get('id')
        
        if target_type == 'agent':
            target_info = self._find_agent(agent_data, target_id)
        elif target_type == 'tool':
            target_info = self._find_tool(agent_data, target_id)
        elif target_type == 'relationship':
            target_info = self._find_relationship(agent_data, target_id)
        else:
            target_info = None
        
        # Execute test using Gemini to simulate and evaluate
        prompt = f"""
Execute and evaluate the following test case for an AI agent system.

Test Case:
{json.dumps(test_case, indent=2)}

Target Information:
{json.dumps(target_info, indent=2)}

Agent Data Context:
{json.dumps(agent_data, indent=2)[:3000]}

Simulate running this test and provide:
1. Whether the test PASSED or FAILED
2. Detailed results
3. Any issues found
4. Recommendations for fixes
5. Severity level (critical|high|medium|low)

If the test reveals issues, provide specific fix suggestions that reference:
- The exact file and line number
- The specific code that needs to change
- The recommended change

Return as JSON:
{{
    "test_id": "{test_case.get('id')}",
    "status": "passed|failed|warning",
    "execution_time": 1.5,
    "results": {{
        "summary": "Test result summary",
        "details": "Detailed findings",
        "issues_found": ["list", "of", "issues"],
        "metrics": {{
            "accuracy": 0.85,
            "performance": "good",
            "security_score": 0.9
        }}
    }},
    "recommendations": [{{
        "severity": "critical|high|medium|low",
        "issue": "Issue description",
        "fix": {{
            "file_path": "path/to/file.py",
            "line_number": 42,
            "current_code": "current code snippet",
            "suggested_code": "suggested fix",
            "explanation": "why this fix helps"
        }}
    }}]
}}
"""
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
            
            return {
                'test_id': test_case.get('id'),
                'status': 'error',
                'results': {'summary': 'Failed to parse test result'},
                'recommendations': []
            }
            
        except Exception as e:
            return {
                'test_id': test_case.get('id'),
                'status': 'error',
                'results': {'summary': f'Error running test: {str(e)}'},
                'recommendations': []
            }
    
    def _find_agent(self, agent_data: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Find agent by ID"""
        for agent in agent_data.get('agents', []):
            if agent.get('id') == agent_id:
                return agent
        return {}
    
    def _find_tool(self, agent_data: Dict[str, Any], tool_id: str) -> Dict[str, Any]:
        """Find tool by ID"""
        for tool in agent_data.get('tools', []):
            if tool.get('id') == tool_id:
                return tool
        return {}
    
    def _find_relationship(self, agent_data: Dict[str, Any], rel_id: str) -> Dict[str, Any]:
        """Find relationship by ID"""
        for rel in agent_data.get('relationships', []):
            if rel.get('id') == rel_id:
                return rel
        return {}


import re  # Add this at the top of the file
