"""
Result Cache Module

This module provides caching functionality for LLM results to improve performance
and reduce redundant processing of the same prompts.
"""

import hashlib
import json
import logging
import time
from typing import Any, Dict, Optional, Union

logger = logging.getLogger(__name__)

class ResultCache:
    """Cache for storing LLM generation results"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        """Initialize the result cache
        
        Args:
            max_size: Maximum number of items in the cache
            ttl: Time to live for cache items in seconds (default: 1 hour)
        """
        self.max_size = max_size
        self.ttl = ttl
        self.cache: Dict[str, Dict[str, Any]] = {}
    
    def _generate_key(self, prompt: str, **kwargs) -> str:
        """Generate a cache key from the prompt and parameters
        
        Args:
            prompt: The text prompt
            **kwargs: Additional parameters affecting generation
            
        Returns:
            str: A hash key for the cache
        """
        # Create a dict with all parameters that affect the result
        key_dict = {
            "prompt": prompt,
            **kwargs
        }
        
        # Create a deterministic JSON string
        key_str = json.dumps(key_dict, sort_keys=True)
        
        # Generate hash
        return hashlib.sha256(key_str.encode()).hexdigest()
    
    def get(self, prompt: str, **kwargs) -> Optional[str]:
        """Retrieve a cached result if available and not expired
        
        Args:
            prompt: The text prompt
            **kwargs: Additional parameters affecting generation
            
        Returns:
            Optional[str]: The cached result or None if not found/expired
        """
        key = self._generate_key(prompt, **kwargs)
        
        if key in self.cache:
            item = self.cache[key]
            
            # Check if item is expired
            if time.time() - item["timestamp"] > self.ttl:
                logger.debug(f"Cache hit but expired for key {key[:10]}...")
                del self.cache[key]
                return None
            
            logger.debug(f"Cache hit for key {key[:10]}...")
            return item["result"]
        
        logger.debug(f"Cache miss for key {key[:10]}...")
        return None
    
    def set(self, prompt: str, result: str, **kwargs) -> None:
        """Store a result in the cache
        
        Args:
            prompt: The text prompt
            result: The result to cache
            **kwargs: Additional parameters affecting generation
        """
        key = self._generate_key(prompt, **kwargs)
        
        # Evict items if cache is full
        if len(self.cache) >= self.max_size:
            # Find the oldest item
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
            logger.debug(f"Cache full, evicted oldest item with key {oldest_key[:10]}...")
        
        # Store the result with timestamp
        self.cache[key] = {
            "result": result,
            "timestamp": time.time()
        }
        logger.debug(f"Cached result for key {key[:10]}...")
    
    def clear(self) -> None:
        """Clear all items from the cache"""
        self.cache.clear()
        logger.debug("Cache cleared")
    
    def size(self) -> int:
        """Get the current size of the cache
        
        Returns:
            int: Number of items in the cache
        """
        return len(self.cache)
    
    def prune_expired(self) -> int:
        """Remove expired items from the cache
        
        Returns:
            int: Number of items removed
        """
        current_time = time.time()
        expired_keys = [
            key for key, item in self.cache.items() 
            if current_time - item["timestamp"] > self.ttl
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        logger.debug(f"Pruned {len(expired_keys)} expired items from cache")
        return len(expired_keys) 