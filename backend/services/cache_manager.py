"""
Cache Manager for storing and retrieving analyzed repository data
"""
import json
import hashlib
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from pathlib import Path

class CacheManager:
    """Manages caching of analyzed repository data"""
    
    def __init__(self, cache_dir: str = "./cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.cache_ttl = timedelta(hours=24)  # Cache expires after 24 hours
        
    def _get_cache_key(self, github_url: str) -> str:
        """Generate cache key from GitHub URL"""
        return hashlib.md5(github_url.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get file path for cache key"""
        return self.cache_dir / f"{cache_key}.json"
    
    def _get_metadata_path(self, cache_key: str) -> Path:
        """Get metadata file path for cache key"""
        return self.cache_dir / f"{cache_key}_meta.json"
    
    def get(self, github_url: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached data for a GitHub URL
        
        Args:
            github_url: GitHub repository URL
            
        Returns:
            Cached data if exists and not expired, None otherwise
        """
        cache_key = self._get_cache_key(github_url)
        cache_path = self._get_cache_path(cache_key)
        meta_path = self._get_metadata_path(cache_key)
        
        # Check if cache exists
        if not cache_path.exists() or not meta_path.exists():
            return None
        
        # Check if cache is expired
        try:
            with open(meta_path, 'r') as f:
                metadata = json.load(f)
            
            cached_time = datetime.fromisoformat(metadata['cached_at'])
            if datetime.now() - cached_time > self.cache_ttl:
                # Cache expired, clean up
                self._delete_cache(cache_key)
                return None
            
            # Load cached data
            with open(cache_path, 'r') as f:
                data = json.load(f)
            
            return data
            
        except Exception as e:
            print(f"Error reading cache: {e}")
            return None
    
    def set(self, github_url: str, data: Dict[str, Any]) -> bool:
        """
        Store data in cache
        
        Args:
            github_url: GitHub repository URL
            data: Agent data to cache
            
        Returns:
            True if successful, False otherwise
        """
        cache_key = self._get_cache_key(github_url)
        cache_path = self._get_cache_path(cache_key)
        meta_path = self._get_metadata_path(cache_key)
        
        try:
            # Save data
            with open(cache_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Save metadata
            metadata = {
                'github_url': github_url,
                'cached_at': datetime.now().isoformat(),
                'cache_key': cache_key
            }
            with open(meta_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Error writing cache: {e}")
            return False
    
    def _delete_cache(self, cache_key: str):
        """Delete cache files for a given key"""
        cache_path = self._get_cache_path(cache_key)
        meta_path = self._get_metadata_path(cache_key)
        
        if cache_path.exists():
            cache_path.unlink()
        if meta_path.exists():
            meta_path.unlink()
    
    def invalidate(self, github_url: str) -> bool:
        """
        Invalidate cache for a GitHub URL
        
        Args:
            github_url: GitHub repository URL
            
        Returns:
            True if cache was deleted, False if not found
        """
        cache_key = self._get_cache_key(github_url)
        cache_path = self._get_cache_path(cache_key)
        
        if cache_path.exists():
            self._delete_cache(cache_key)
            return True
        return False
    
    def clear_all(self):
        """Clear all cached data"""
        for file in self.cache_dir.glob("*.json"):
            file.unlink()
    
    def get_all_cached_repos(self) -> list:
        """Get list of all cached repositories"""
        cached_repos = []
        
        for meta_file in self.cache_dir.glob("*_meta.json"):
            try:
                with open(meta_file, 'r') as f:
                    metadata = json.load(f)
                    cached_repos.append({
                        'github_url': metadata['github_url'],
                        'cached_at': metadata['cached_at'],
                        'cache_key': metadata['cache_key']
                    })
            except Exception as e:
                print(f"Error reading metadata {meta_file}: {e}")
        
        return cached_repos
