import json
import os
import requests
from typing import Dict, Any, List, Optional
from config import Config

class CodeEditor:
    """Service for editing code and applying fixes"""
    
    def __init__(self):
        self.code_changes = []  # Track all changes made
        self.github_token = os.getenv('GITHUB_TOKEN')
        
    def apply_fix(self, fix: Dict[str, Any], agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply a suggested fix to the codebase via GitHub API
        
        Args:
            fix: Fix suggestion with file path, line number, and code changes
            agent_data: Full agent data context
            
        Returns:
            Result of applying the fix
        """
        file_path = fix.get('file_path')
        line_number = fix.get('line_number')
        current_code = fix.get('current_code')
        suggested_code = fix.get('suggested_code')
        explanation = fix.get('explanation', '')
        
        # Track the change locally
        change = {
            'type': 'fix_applied',
            'fix': fix,
            'timestamp': self._get_timestamp()
        }
        self.code_changes.append(change)
        
        # Try to apply via GitHub if we have repo info and token
        github_result = None
        if self.github_token and agent_data.get('repository'):
            try:
                github_result = self._apply_fix_to_github(
                    fix=fix,
                    repo_info=agent_data['repository'],
                    explanation=explanation
                )
            except Exception as e:
                print(f"Failed to apply fix to GitHub: {str(e)}")
                github_result = {'error': str(e)}
        
        return {
            'status': 'applied' if github_result and not github_result.get('error') else 'local_only',
            'file_path': file_path,
            'line_number': line_number,
            'old_code': current_code,
            'new_code': suggested_code,
            'change_id': len(self.code_changes) - 1,
            'github_result': github_result
        }
    
    def _apply_fix_to_github(
        self, 
        fix: Dict[str, Any], 
        repo_info: Dict[str, str],
        explanation: str
    ) -> Dict[str, Any]:
        """
        Apply fix directly to GitHub repository
        
        Args:
            fix: Fix details
            repo_info: Repository information (owner, repo_name)
            explanation: Explanation of the fix
            
        Returns:
            GitHub API response
        """
        owner = repo_info.get('owner')
        repo_name = repo_info.get('repo_name')
        file_path = fix.get('file_path')
        current_code = fix.get('current_code', '')
        suggested_code = fix.get('suggested_code', '')
        
        if not all([owner, repo_name, file_path]):
            return {'error': 'Missing repository information'}
        
        # GitHub API headers
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json',
        }
        
        # Get current file content
        file_url = f'https://api.github.com/repos/{owner}/{repo_name}/contents/{file_path}'
        response = requests.get(file_url, headers=headers)
        
        if response.status_code != 200:
            return {'error': f'Failed to fetch file: {response.json().get("message", "Unknown error")}'}
        
        file_data = response.json()
        current_content = requests.utils.unquote(file_data['content'])
        
        # Decode base64 content
        import base64
        decoded_content = base64.b64decode(current_content).decode('utf-8')
        
        # Apply the fix (simple string replacement)
        if current_code.strip() in decoded_content:
            new_content = decoded_content.replace(current_code.strip(), suggested_code.strip())
        else:
            # Try line-based replacement
            lines = decoded_content.split('\n')
            line_num = fix.get('line_number', 0)
            if 0 < line_num <= len(lines):
                lines[line_num - 1] = suggested_code.strip()
                new_content = '\n'.join(lines)
            else:
                return {'error': 'Could not locate code to replace'}
        
        # Encode new content
        new_content_encoded = base64.b64encode(new_content.encode('utf-8')).decode('utf-8')
        
        # Create commit message
        commit_message = f"🤖 Auto-fix: {explanation[:100]}"
        
        # Update file on GitHub
        update_data = {
            'message': commit_message,
            'content': new_content_encoded,
            'sha': file_data['sha'],
        }
        
        update_response = requests.put(file_url, headers=headers, json=update_data)
        
        if update_response.status_code in [200, 201]:
            result = update_response.json()
            return {
                'success': True,
                'commit_sha': result['commit']['sha'],
                'commit_url': result['commit']['html_url'],
                'message': 'Fix applied to GitHub successfully'
            }
        else:
            return {
                'error': f'Failed to update file: {update_response.json().get("message", "Unknown error")}'
            }
    
    def create_pull_request_with_fixes(
        self,
        fixes: List[Dict[str, Any]],
        repo_info: Dict[str, str],
        branch_name: str = 'auto-fixes'
    ) -> Dict[str, Any]:
        """
        Create a pull request with multiple fixes
        
        Args:
            fixes: List of fixes to apply
            repo_info: Repository information
            branch_name: Name of the branch to create
            
        Returns:
            PR creation result
        """
        # This would create a new branch and PR with all fixes
        # For now, return a placeholder
        return {
            'status': 'not_implemented',
            'message': 'PR creation coming soon',
            'fixes_count': len(fixes)
        }
    
    def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update agent configuration or code
        
        Args:
            agent_id: Agent identifier
            updates: Dictionary of updates to apply
            
        Returns:
            Updated agent configuration
        """
        # Track the change
        change = {
            'type': 'agent_update',
            'agent_id': agent_id,
            'updates': updates,
            'timestamp': self._get_timestamp()
        }
        self.code_changes.append(change)
        
        return {
            'agent_id': agent_id,
            'status': 'updated',
            'changes': updates,
            'change_id': len(self.code_changes) - 1
        }
    
    def update_tool(self, tool_id: str, new_code: str) -> Dict[str, Any]:
        """
        Update tool code
        
        Args:
            tool_id: Tool identifier
            new_code: New code for the tool
            
        Returns:
            Updated tool information
        """
        change = {
            'type': 'tool_update',
            'tool_id': tool_id,
            'new_code': new_code,
            'timestamp': self._get_timestamp()
        }
        self.code_changes.append(change)
        
        return {
            'tool_id': tool_id,
            'status': 'updated',
            'change_id': len(self.code_changes) - 1
        }
    
    def get_changes(self) -> List[Dict[str, Any]]:
        """Get all code changes made"""
        return self.code_changes
    
    def export_changes(self) -> str:
        """Export all changes as a patch or diff"""
        # Generate a summary of all changes
        summary = {
            'total_changes': len(self.code_changes),
            'changes': self.code_changes
        }
        return json.dumps(summary, indent=2)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

        """
        Update agent configuration or code
        
        Args:
            agent_id: Agent identifier
            updates: Dictionary of updates to apply
            
        Returns:
            Updated agent configuration
        """
        # Track the change
        change = {
            'type': 'agent_update',
            'agent_id': agent_id,
            'updates': updates,
            'timestamp': self._get_timestamp()
        }
        self.code_changes.append(change)
        
        return {
            'agent_id': agent_id,
            'status': 'updated',
            'changes': updates,
            'change_id': len(self.code_changes) - 1
        }
    
    def update_tool(self, tool_id: str, new_code: str) -> Dict[str, Any]:
        """
        Update tool code
        
        Args:
            tool_id: Tool identifier
            new_code: New code for the tool
            
        Returns:
            Updated tool information
        """
        change = {
            'type': 'tool_update',
            'tool_id': tool_id,
            'new_code': new_code,
            'timestamp': self._get_timestamp()
        }
        self.code_changes.append(change)
        
        return {
            'tool_id': tool_id,
            'status': 'updated',
            'change_id': len(self.code_changes) - 1
        }
    
    def apply_fix(self, fix: Dict[str, Any], agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply a suggested fix to the codebase
        
        Args:
            fix: Fix suggestion with file path, line number, and code changes
            agent_data: Full agent data context
            
        Returns:
            Result of applying the fix
        """
        file_path = fix.get('file_path')
        line_number = fix.get('line_number')
        current_code = fix.get('current_code')
        suggested_code = fix.get('suggested_code')
        
        change = {
            'type': 'fix_applied',
            'fix': fix,
            'timestamp': self._get_timestamp()
        }
        self.code_changes.append(change)
        
        return {
            'status': 'applied',
            'file_path': file_path,
            'line_number': line_number,
            'old_code': current_code,
            'new_code': suggested_code,
            'change_id': len(self.code_changes) - 1
        }
    
    def get_changes(self) -> List[Dict[str, Any]]:
        """Get all code changes made"""
        return self.code_changes
    
    def export_changes(self) -> str:
        """Export all changes as a patch or diff"""
        # Generate a summary of all changes
        summary = {
            'total_changes': len(self.code_changes),
            'changes': self.code_changes
        }
        return json.dumps(summary, indent=2)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
