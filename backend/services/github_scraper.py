import os
import requests
from github import Github
from typing import Dict, List, Any
from config import Config
import logging

# Configure logging
logger = logging.getLogger(__name__)

class GitHubScraper:
    """Service for scraping GitHub repositories"""
    
    def __init__(self):
        self.github = Github(Config.GITHUB_TOKEN)
        logger.info("GitHubScraper initialized")
        
    def scrape_repository(self, github_url: str) -> Dict[str, Any]:
        """
        Scrape a GitHub repository and extract all relevant files
        
        Args:
            github_url: URL of the GitHub repository
            
        Returns:
            Dictionary containing repository structure and file contents
        """
        try:
            logger.info(f"=== Scraping repository: {github_url} ===")
            
            # Parse GitHub URL to get owner and repo name
            parts = github_url.rstrip('/').split('/')
            owner = parts[-2]
            repo_name = parts[-1]
            
            logger.info(f"Repository owner: {owner}, name: {repo_name}")
            
            # Get repository
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            logger.info(f"Repository found: {repo.full_name}")
            logger.info(f"  Language: {repo.language}")
            logger.info(f"  Description: {repo.description}")
            
            # Get all files
            logger.info("Fetching all files from repository...")
            files = self._get_all_files(repo)
            logger.info(f"Successfully fetched {len(files)} files")
            
            # Log file distribution by extension
            extensions = {}
            for file in files:
                ext = file.get('extension', 'unknown')
                extensions[ext] = extensions.get(ext, 0) + 1
            logger.info(f"File distribution by extension: {extensions}")
            
            result = {
                'owner': owner,
                'repo_name': repo_name,
                'description': repo.description,
                'language': repo.language,
                'files': files,
                'structure': self._build_structure(files)
            }
            
            logger.info(f"=== Repository scraping complete: {len(files)} files ===")
            return result
            
        except Exception as e:
            logger.error(f"Failed to scrape repository {github_url}: {str(e)}", exc_info=True)
            raise Exception(f"Failed to scrape repository: {str(e)}")
    
    def _get_all_files(self, repo) -> List[Dict[str, Any]]:
        """
        Recursively get all files from repository
        
        Args:
            repo: GitHub repository object
            
        Returns:
            List of file dictionaries with path and content
        """
        logger.info("Recursively fetching all repository files...")
        files = []
        contents = repo.get_contents("")
        
        processed_count = 0
        skipped_count = 0
        error_count = 0
        
        while contents:
            file_content = contents.pop(0)
            processed_count += 1
            
            if file_content.type == "dir":
                logger.debug(f"  Directory: {file_content.path}")
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
                            logger.debug(f"  ✓ {file_content.path} ({file_content.size} bytes)")
                        else:
                            skipped_count += 1
                            logger.debug(f"  ✗ {file_content.path} - too large ({file_content.size} bytes)")
                    except Exception as e:
                        error_count += 1
                        logger.warning(f"  ✗ Error reading file {file_content.path}: {str(e)}")
                else:
                    skipped_count += 1
                    logger.debug(f"  ✗ {file_content.path} - unsupported extension")
        
        logger.info(f"File processing complete: {len(files)} files fetched, {skipped_count} skipped, {error_count} errors")
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
