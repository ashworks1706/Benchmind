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
            error_data = response.json() if response.text else {}
            return {'error': f'Failed to fetch file: {error_data.get("message", "Unknown error")}'}
        
        file_data = response.json()
        if not file_data or 'content' not in file_data:
            return {'error': 'Invalid file data received from GitHub'}
        
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
            if not result or 'commit' not in result:
                return {
                    'success': True,
                    'message': 'Fix applied but response format unexpected'
                }
            return {
                'success': True,
                'commit_sha': result['commit'].get('sha'),
                'commit_url': result['commit'].get('html_url'),
                'message': 'Fix applied to GitHub successfully'
            }
        else:
            error_data = update_response.json() if update_response.text else {}
            return {
                'error': f'Failed to update file: {error_data.get("message", "Unknown error")}'
            }
    
    def apply_fixes_batch(
        self, 
        fixes: List[Dict[str, Any]], 
        agent_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Apply multiple fixes in a single commit via Pull Request
        
        Args:
            fixes: List of fix suggestions
            agent_data: Full agent data context
            
        Returns:
            Result of creating PR with all fixes
        """
        if not self.github_token or not agent_data.get('repository'):
            return {
                'error': 'GitHub token or repository information missing',
                'applied_locally': len(fixes)
            }
        
        repo_info = agent_data['repository']
        owner = repo_info.get('owner')
        repo_name = repo_info.get('repo_name')
        
        if not all([owner, repo_name]):
            return {'error': 'Missing repository information'}
        
        # Use the PR creation method
        return self.create_pull_request_with_fixes(fixes, repo_info)
    
    def create_pull_request_with_fixes(
        self,
        fixes: List[Dict[str, Any]],
        repo_info: Dict[str, str],
        branch_name: str = None
    ) -> Dict[str, Any]:
        """
        Create a pull request with multiple fixes
        
        Args:
            fixes: List of fixes to apply
            repo_info: Repository information
            branch_name: Name of the branch to create (auto-generated if None)
            
        Returns:
            PR creation result
        """
        import base64
        from datetime import datetime
        
        owner = repo_info.get('owner')
        repo_name = repo_info.get('repo_name')
        
        if not all([owner, repo_name, self.github_token]):
            return {'error': 'Missing repository information or GitHub token'}
        
        # Generate branch name if not provided
        if not branch_name:
            timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
            branch_name = f'copilot-fixes-{timestamp}'
        
        # GitHub API headers
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json',
        }
        
        try:
            # Step 1: Get the default branch and its SHA
            repo_url = f'https://api.github.com/repos/{owner}/{repo_name}'
            repo_response = requests.get(repo_url, headers=headers)
            if repo_response.status_code != 200:
                error_data = repo_response.json() if repo_response.text else {}
                return {'error': f'Failed to get repository: {error_data.get("message", "Unknown error")}'}
            
            repo_data = repo_response.json()
            if not repo_data:
                return {'error': 'Empty response from GitHub API'}
            
            default_branch = repo_data.get('default_branch')
            if not default_branch:
                return {'error': 'Could not determine default branch from repository'}
            
            # Get the SHA of the default branch
            ref_url = f'https://api.github.com/repos/{owner}/{repo_name}/git/refs/heads/{default_branch}'
            ref_response = requests.get(ref_url, headers=headers)
            if ref_response.status_code != 200:
                error_data = ref_response.json() if ref_response.text else {}
                return {'error': f'Failed to get branch reference: {error_data.get("message", "Unknown error")}'}
            
            ref_data = ref_response.json()
            if not ref_data or 'object' not in ref_data:
                return {'error': 'Invalid branch reference response from GitHub'}
            
            base_sha = ref_data['object']['sha']
            
            # Step 2: Create a new branch
            create_ref_url = f'https://api.github.com/repos/{owner}/{repo_name}/git/refs'
            create_ref_data = {
                'ref': f'refs/heads/{branch_name}',
                'sha': base_sha
            }
            create_ref_response = requests.post(create_ref_url, headers=headers, json=create_ref_data)
            
            if create_ref_response.status_code not in [200, 201]:
                error_data = create_ref_response.json() if create_ref_response.text else {}
                error_msg = error_data.get('message', 'Unknown error')
                # If branch already exists, try to delete and recreate
                if 'already exists' in error_msg:
                    delete_ref_url = f'https://api.github.com/repos/{owner}/{repo_name}/git/refs/heads/{branch_name}'
                    requests.delete(delete_ref_url, headers=headers)
                    create_ref_response = requests.post(create_ref_url, headers=headers, json=create_ref_data)
                    if create_ref_response.status_code not in [200, 201]:
                        return {'error': f'Failed to create branch: {error_msg}'}
            
            # Step 3: Group fixes by file and apply them
            files_to_update = {}
            for fix in fixes:
                file_path = fix.get('file_path')
                if file_path not in files_to_update:
                    files_to_update[file_path] = []
                files_to_update[file_path].append(fix)
            
            updated_files = []
            errors = []
            
            # Process each file
            for file_path, file_fixes in files_to_update.items():
                try:
                    # Get current file content from the new branch
                    file_url = f'https://api.github.com/repos/{owner}/{repo_name}/contents/{file_path}?ref={branch_name}'
                    response = requests.get(file_url, headers=headers)
                    
                    if response.status_code != 200:
                        errors.append(f'{file_path}: Failed to fetch')
                        continue
                    
                    file_data = response.json()
                    if not file_data or 'content' not in file_data:
                        errors.append(f'{file_path}: Invalid file data from GitHub')
                        continue
                    
                    # Decode base64 content
                    decoded_content = base64.b64decode(file_data['content']).decode('utf-8')
                    new_content = decoded_content
                    
                    # Apply all fixes to this file
                    for fix in file_fixes:
                        current_code = fix.get('current_code', '')
                        suggested_code = fix.get('suggested_code', '')
                        
                        if current_code.strip() in new_content:
                            new_content = new_content.replace(current_code.strip(), suggested_code.strip())
                        else:
                            # Try line-based replacement
                            lines = new_content.split('\n')
                            line_num = fix.get('line_number', 0)
                            if 0 < line_num <= len(lines):
                                lines[line_num - 1] = suggested_code.strip()
                                new_content = '\n'.join(lines)
                    
                    # Encode new content
                    new_content_encoded = base64.b64encode(new_content.encode('utf-8')).decode('utf-8')
                    
                    # Create commit message for this file
                    commit_message = f"🤖 Apply {len(file_fixes)} fix{'es' if len(file_fixes) > 1 else ''} to {file_path}"
                    
                    # Update file on the new branch
                    update_data = {
                        'message': commit_message,
                        'content': new_content_encoded,
                        'sha': file_data['sha'],
                        'branch': branch_name
                    }
                    
                    update_response = requests.put(
                        f'https://api.github.com/repos/{owner}/{repo_name}/contents/{file_path}',
                        headers=headers,
                        json=update_data
                    )
                    
                    if update_response.status_code in [200, 201]:
                        updated_files.append({
                            'file': file_path,
                            'fixes_applied': len(file_fixes)
                        })
                    else:
                        error_data = update_response.json() if update_response.text else {}
                        errors.append(f'{file_path}: {error_data.get("message", "Unknown error")}')
                        
                except Exception as e:
                    errors.append(f'{file_path}: {str(e)}')
            
            if not updated_files:
                return {
                    'error': 'No files were successfully updated',
                    'details': errors
                }
            
            # Step 4: Create Pull Request
            pr_title = f"🤖 Copilot AI Agent Fixes - {len(fixes)} improvements"
            pr_body = f"""## 🤖 Automated Code Improvements

This PR contains **{len(fixes)} fix{'es' if len(fixes) > 1 else ''}** across **{len(updated_files)} file{'s' if len(updated_files) > 1 else ''}** identified by Copilot AI Agent analysis.

### Files Modified:
"""
            for file_info in updated_files:
                pr_body += f"- `{file_info['file']}` - {file_info['fixes_applied']} fix{'es' if file_info['fixes_applied'] > 1 else ''}\n"
            
            pr_body += f"""
### Summary:
These changes improve code quality, performance, and maintainability based on AI agent analysis.

---
*Generated by Copilot AI Agent Benchmark Tool*
"""
            
            pr_url = f'https://api.github.com/repos/{owner}/{repo_name}/pulls'
            pr_data = {
                'title': pr_title,
                'body': pr_body,
                'head': branch_name,
                'base': default_branch
            }
            
            pr_response = requests.post(pr_url, headers=headers, json=pr_data)
            
            if pr_response.status_code in [200, 201]:
                pr_result = pr_response.json()
                if not pr_result:
                    return {
                        'error': 'Empty response when creating PR',
                        'branch_created': branch_name,
                        'files_updated': updated_files
                    }
                return {
                    'success': True,
                    'pr_number': pr_result.get('number'),
                    'pr_url': pr_result.get('html_url'),
                    'branch': branch_name,
                    'files_updated': len(updated_files),
                    'total_fixes': len(fixes),
                    'updated_files': updated_files,
                    'errors': errors if errors else None
                }
            else:
                error_data = pr_response.json() if pr_response.text else {}
                return {
                    'error': f'Failed to create PR: {error_data.get("message", "Unknown error")}',
                    'branch_created': branch_name,
                    'files_updated': updated_files
                }
                
        except Exception as e:
            return {
                'error': f'Exception during PR creation: {str(e)}',
                'type': type(e).__name__
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
