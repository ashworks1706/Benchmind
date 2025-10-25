import os
import requests
from github import Github
from typing import Dict, List, Any
from config import Config

class GitHubScraper:
    """Service for scraping GitHub repositories"""
    
    def __init__(self):
        self.github = Github(Config.GITHUB_TOKEN)
        
    def scrape_repository(self, github_url: str) -> Dict[str, Any]:
        """
        Scrape a GitHub repository and extract all relevant files
        
        Args:
            github_url: URL of the GitHub repository
            
        Returns:
            Dictionary containing repository structure and file contents
        """
        try:
            # Parse GitHub URL to get owner and repo name
            parts = github_url.rstrip('/').split('/')
            owner = parts[-2]
            repo_name = parts[-1]
            
            # Get repository
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            
            # Get all files
            files = self._get_all_files(repo)
            
            return {
                'owner': owner,
                'repo_name': repo_name,
                'description': repo.description,
                'language': repo.language,
                'files': files,
                'structure': self._build_structure(files)
            }
            
        except Exception as e:
            raise Exception(f"Failed to scrape repository: {str(e)}")
    
    def _get_all_files(self, repo) -> List[Dict[str, Any]]:
        """
        Recursively get all files from repository
        
        Args:
            repo: GitHub repository object
            
        Returns:
            List of file dictionaries with path and content
        """
        files = []
        contents = repo.get_contents("")
        
        while contents:
            file_content = contents.pop(0)
            
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            else:
                # Filter by supported extensions
                if any(file_content.path.endswith(ext) for ext in Config.SUPPORTED_EXTENSIONS):
                    try:
                        # Check file size
                        if file_content.size <= Config.MAX_FILE_SIZE:
                            content = file_content.decoded_content.decode('utf-8')
                            files.append({
                                'path': file_content.path,
                                'name': file_content.name,
                                'content': content,
                                'size': file_content.size,
                                'extension': os.path.splitext(file_content.name)[1]
                            })
                    except Exception as e:
                        print(f"Error reading file {file_content.path}: {str(e)}")
        
        return files
    
    def _build_structure(self, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Build a tree structure from flat file list
        
        Args:
            files: List of file dictionaries
            
        Returns:
            Nested dictionary representing file structure
        """
        structure = {}
        
        for file in files:
            parts = file['path'].split('/')
            current = structure
            
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    # Leaf node (file)
                    current[part] = {
                        'type': 'file',
                        'path': file['path'],
                        'extension': file['extension']
                    }
                else:
                    # Directory node
                    if part not in current:
                        current[part] = {'type': 'directory'}
                    current = current[part]
        
        return structure
