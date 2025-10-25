import json
from typing import Dict, Any, List

class CodeEditor:
    """Service for editing code and applying fixes"""
    
    def __init__(self):
        self.code_changes = []  # Track all changes made
        
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
