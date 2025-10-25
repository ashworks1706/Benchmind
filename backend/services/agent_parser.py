import re
import json
import google.generativeai as genai
from typing import Dict, List, Any, Optional
from config import Config

genai.configure(api_key=Config.GEMINI_API_KEY)

class AgentParser:
    """Service for parsing LangChain agents from repository code"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
        
    def parse_agents(self, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse agents from repository data
        
        Args:
            repo_data: Repository structure and file contents
            
        Returns:
            Structured agent data with configurations, tools, and relationships
        """
        files = repo_data.get('files', [])
        
        # Step 1: Identify files containing LangChain agents
        agent_files = self._identify_agent_files(files)
        
        # Step 2: Extract agent configurations
        agents = []
        for file in agent_files:
            extracted_agents = self._extract_agents_from_file(file)
            agents.extend(extracted_agents)
        
        # Step 3: Extract tools
        tools = self._extract_tools(files, agents)
        
        # Step 4: Identify relationships between agents
        relationships = self._identify_relationships(agents, files)
        
        return {
            'agents': agents,
            'tools': tools,
            'relationships': relationships,
            'repository': {
                'owner': repo_data.get('owner'),
                'repo_name': repo_data.get('repo_name'),
                'description': repo_data.get('description')
            }
        }
    
    def _identify_agent_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify files that contain LangChain agent definitions"""
        agent_files = []
        
        # Keywords that indicate agent usage
        agent_keywords = [
            'from langchain', 'import langchain',
            'Agent', 'AgentExecutor', 'create_agent',
            'initialize_agent', 'ChatAgent', 'ConversationalAgent'
        ]
        
        for file in files:
            content = file.get('content', '')
            if any(keyword in content for keyword in agent_keywords):
                agent_files.append(file)
        
        return agent_files
    
    def _extract_agents_from_file(self, file: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract agent configurations from a file using Gemini AI"""
        
        prompt = f"""
Analyze the following Python code and extract all LangChain agent configurations.
For each agent found, provide:
1. Agent name/identifier
2. Agent type (e.g., zero-shot-react, conversational, etc.)
3. System instructions/prompt template
4. Model configuration (temperature, model name, etc.)
5. Tools used by the agent
6. Any custom parameters or hyperparameters
7. The objective/purpose of the agent

File: {file['path']}
Code:
```python
{file['content']}
```

Return the result as a JSON array of agent objects. Each agent object should have this structure:
{{
    "id": "unique_identifier",
    "name": "agent_name",
    "type": "agent_type",
    "file_path": "{file['path']}",
    "prompt": "system_instruction_or_prompt",
    "system_instruction": "system_instruction",
    "model_config": {{
        "model": "model_name",
        "temperature": 0.7,
        "max_tokens": 1000
    }},
    "tools": ["tool1", "tool2"],
    "hyperparameters": {{}},
    "objective": "agent_purpose",
    "code_snippet": "relevant_code"
}}

If no agents are found, return an empty array [].
"""
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                agents = json.loads(json_match.group())
                return agents
            
            return []
            
        except Exception as e:
            print(f"Error extracting agents from {file['path']}: {str(e)}")
            return []
    
    def _extract_tools(self, files: List[Dict[str, Any]], agents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract tool definitions from the codebase"""
        
        # Collect all tool names mentioned in agents
        tool_names = set()
        for agent in agents:
            tool_names.update(agent.get('tools', []))
        
        tools = []
        
        # Search for tool definitions in files
        for file in files:
            content = file.get('content', '')
            
            # Look for tool decorators or function definitions
            if '@tool' in content or 'Tool(' in content or 'StructuredTool' in content:
                extracted_tools = self._extract_tools_from_file(file, tool_names)
                tools.extend(extracted_tools)
        
        return tools
    
    def _extract_tools_from_file(self, file: Dict[str, Any], tool_names: set) -> List[Dict[str, Any]]:
        """Extract specific tool definitions from a file using Gemini"""
        
        prompt = f"""
Analyze the following code and extract all tool definitions.
For each tool, provide:
1. Tool name
2. Tool description
3. Function signature
4. Parameters
5. Return type
6. Full code implementation

File: {file['path']}
Code:
```python
{file['content']}
```

Return as JSON array with this structure:
[{{
    "id": "tool_unique_id",
    "name": "tool_name",
    "description": "what_the_tool_does",
    "file_path": "{file['path']}",
    "parameters": [{{"name": "param1", "type": "str", "description": "..."}}],
    "return_type": "return_type",
    "code": "full_function_code",
    "summary": "brief_summary"
}}]
"""
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                tools = json.loads(json_match.group())
                return tools
            
            return []
            
        except Exception as e:
            print(f"Error extracting tools from {file['path']}: {str(e)}")
            return []
    
    def _identify_relationships(self, agents: List[Dict[str, Any]], files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify relationships between agents using Gemini"""
        
        if len(agents) < 2:
            return []
        
        # Create context from all files
        context = "\n\n".join([
            f"File: {f['path']}\n```\n{f['content'][:2000]}\n```"  # Limit content length
            for f in files[:10]  # Analyze top 10 files
        ])
        
        agent_summary = json.dumps([
            {'id': a['id'], 'name': a['name'], 'type': a['type'], 'tools': a.get('tools', [])}
            for a in agents
        ], indent=2)
        
        prompt = f"""
Analyze the following codebase and agent configurations to identify relationships between agents.

Agents:
{agent_summary}

Code Context:
{context}

Identify:
1. Which agents call or invoke other agents
2. How agents collaborate or share information
3. Sequential or parallel execution patterns
4. Data flow between agents

Return as JSON array:
[{{
    "id": "relationship_id",
    "from_agent_id": "agent1_id",
    "to_agent_id": "agent2_id",
    "type": "calls|collaborates|sequential|parallel",
    "description": "relationship_description",
    "data_flow": "what_data_is_passed"
}}]
"""
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                relationships = json.loads(json_match.group())
                return relationships
            
            return []
            
        except Exception as e:
            print(f"Error identifying relationships: {str(e)}")
            return []
