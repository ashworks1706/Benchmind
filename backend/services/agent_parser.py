import re
import json
import google.generativeai as genai
from typing import Dict, List, Any, Optional
from config import Config
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import logging

# Configure logging
logger = logging.getLogger(__name__)

genai.configure(api_key=Config.GEMINI_API_KEY)

class AgentParser:
    """Service for parsing LangChain agents from repository code"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')  # Using faster model
        self.request_timeout = 120  # 2 minutes timeout
        self.max_retries = 2
        logger.info(f"AgentParser initialized with model: gemini-2.0-flash-exp")
        
    def parse_agents(self, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse agents from repository data
        
        Args:
            repo_data: Repository structure and file contents
            
        Returns:
            Structured agent data with configurations, tools, and relationships
        """
        logger.info("=== Starting agent parsing ===")
        files = repo_data.get('files', [])
        logger.info(f"Total files in repo_data: {len(files)}")
        
        # Log first few file paths for debugging
        if files:
            logger.info(f"Sample file paths: {[f.get('path', 'no-path') for f in files[:5]]}")
        else:
            logger.warning("No files found in repo_data!")
        
        # Step 1: Identify files containing LangChain agents
        logger.info("Step 1: Identifying agent files...")
        agent_files = self._identify_agent_files(files)
        logger.info(f"Found {len(agent_files)} files that may contain agents")
        if agent_files:
            logger.info(f"Agent file paths: {[f.get('path') for f in agent_files]}")
        
        # Step 2: Extract agent configurations
        logger.info("Step 2: Extracting agent configurations...")
        agents = []
        for idx, file in enumerate(agent_files):
            logger.info(f"Processing agent file {idx+1}/{len(agent_files)}: {file.get('path')}")
            extracted_agents = self._extract_agents_from_file(file)
            logger.info(f"  -> Extracted {len(extracted_agents)} agents from this file")
            agents.extend(extracted_agents)
        
        logger.info(f"Total agents extracted: {len(agents)}")
        if agents:
            logger.info(f"Agent names: {[a.get('name', 'unnamed') for a in agents]}")
        
        # Step 3: Extract tools
        logger.info("Step 3: Extracting tools...")
        tools = self._extract_tools(files, agents)
        logger.info(f"Total tools extracted: {len(tools)}")
        if tools:
            logger.info(f"Tool names: {[t.get('name', 'unnamed') for t in tools]}")
        
        # Step 4: Identify relationships between agents
        logger.info("Step 4: Identifying relationships...")
        relationships = self._identify_relationships(agents, files)
        logger.info(f"Total relationships identified: {len(relationships)}")
        
        result = {
            'agents': agents,
            'tools': tools,
            'relationships': relationships,
            'repository': {
                'owner': repo_data.get('owner'),
                'repo_name': repo_data.get('repo_name'),
                'description': repo_data.get('description')
            }
        }
        
        logger.info(f"=== Agent parsing complete: {len(agents)} agents, {len(tools)} tools, {len(relationships)} relationships ===")
        return result
    
    def _identify_agent_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify files that contain LangChain agent definitions"""
        logger.info(f"Scanning {len(files)} files for agent keywords...")
        agent_files = []
        
        # Keywords that indicate agent usage
        agent_keywords = [
            'from langchain', 'import langchain',
            'Agent', 'AgentExecutor', 'create_agent',
            'initialize_agent', 'ChatAgent', 'ConversationalAgent'
        ]
        
        for file in files:
            content = file.get('content', '')
            path = file.get('path', 'unknown')
            
            # Check if any keyword is in the file
            matching_keywords = [kw for kw in agent_keywords if kw in content]
            
            if matching_keywords:
                logger.info(f"  ✓ {path} contains: {matching_keywords}")
                agent_files.append(file)
            else:
                logger.debug(f"  ✗ {path} - no agent keywords found")
        
        logger.info(f"Identified {len(agent_files)} potential agent files")
        return agent_files
    
    def _extract_agents_from_file(self, file: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract agent configurations from a file using Gemini AI"""
        
        file_path = file.get('path', 'unknown')
        logger.info(f"Extracting agents from {file_path} using Gemini AI...")
        
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
            logger.info(f"  Sending request to Gemini AI for {file_path}...")
            # Use ThreadPoolExecutor for timeout
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self.model.generate_content, prompt)
                try:
                    response = future.result(timeout=30)  # 30 second timeout
                    text = response.text.strip()
                    logger.info(f"  Received response from Gemini AI ({len(text)} chars)")
                    logger.debug(f"  Response preview: {text[:200]}...")
                except (FuturesTimeoutError, Exception) as e:
                    logger.error(f"  Agent extraction timed out or failed for {file_path}: {str(e)}")
                    return []
            
            # Extract JSON from response
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                agents = json.loads(json_match.group())
                logger.info(f"  Successfully parsed {len(agents)} agents from response")
                return agents
            else:
                logger.warning(f"  No JSON array found in response for {file_path}")
                logger.debug(f"  Full response: {text}")
            
            return []
            
        except json.JSONDecodeError as e:
            logger.error(f"  JSON decode error for {file_path}: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"  Error extracting agents from {file_path}: {str(e)}", exc_info=True)
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
            # Use ThreadPoolExecutor for timeout
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self.model.generate_content, prompt)
                try:
                    response = future.result(timeout=30)  # 30 second timeout
                    text = response.text.strip()
                except (FuturesTimeoutError, Exception) as e:
                    print(f"Tool extraction timed out or failed for {file['path']}: {str(e)}")
                    return []
            
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
            # Use ThreadPoolExecutor for timeout
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self.model.generate_content, prompt)
                try:
                    response = future.result(timeout=30)  # 30 second timeout
                    text = response.text.strip()
                except (FuturesTimeoutError, Exception) as e:
                    print(f"Relationship identification timed out or failed: {str(e)}")
                    return []
            
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                relationships = json.loads(json_match.group())
                return relationships
            
            return []
            
        except Exception as e:
            print(f"Error identifying relationships: {str(e)}")
            return []
