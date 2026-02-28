"""Performance optimization utilities for Magna AI Agent.

This module provides utilities for:
- Progress indicators for slow requests
- Request caching
- Streaming response handling
- Parallel tool execution
"""

import asyncio
import time
from typing import AsyncIterator, Any, Dict, Optional, List, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import hashlib


@dataclass
class ProgressUpdate:
    """Progress update for slow requests."""
    
    message: str
    progress_percent: Optional[int] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'message': self.message,
            'progress_percent': self.progress_percent,
            'timestamp': self.timestamp.isoformat()
        }


class ProgressIndicator:
    """Manages progress indicators for slow requests.
    
    Shows progress updates when requests take longer than threshold.
    """
    
    def __init__(self, threshold_seconds: float = 2.0):
        """Initialize progress indicator.
        
        Args:
            threshold_seconds: Time threshold to trigger progress indicator
        """
        self.threshold_seconds = threshold_seconds
        self._active_tasks: Dict[str, asyncio.Task] = {}
    
    async def track_request(
        self,
        request_id: str,
        operation: Callable,
        *args,
        **kwargs
    ) -> AsyncIterator[Any]:
        """Track request and yield progress updates if slow.
        
        Args:
            request_id: Unique identifier for the request
            operation: Async function to execute
            *args: Positional arguments for operation
            **kwargs: Keyword arguments for operation
            
        Yields:
            Progress updates if request exceeds threshold, then final result
        """
        start_time = time.time()
        
        # Create task for the operation
        task = asyncio.create_task(operation(*args, **kwargs))
        self._active_tasks[request_id] = task
        
        try:
            # Wait for threshold using asyncio.wait instead of wait_for
            done, pending = await asyncio.wait(
                [task],
                timeout=self.threshold_seconds
            )
            
            if done:
                # Completed within threshold, return result directly
                result = task.result()
                yield result
                return
            
            # Exceeded threshold, start showing progress
            yield ProgressUpdate(
                message="Processing your request...",
                progress_percent=None
            )
            
            # Continue waiting with periodic updates
            while not task.done():
                await asyncio.sleep(1.0)
                elapsed = time.time() - start_time
                yield ProgressUpdate(
                    message=f"Still processing... ({int(elapsed)}s elapsed)",
                    progress_percent=None
                )
            
            # Get final result
            result = task.result()
            yield result
                
        except asyncio.CancelledError:
            # Task was cancelled, propagate
            raise
        except Exception as e:
            # Task raised an exception
            raise e
        finally:
            # Cleanup
            if request_id in self._active_tasks:
                del self._active_tasks[request_id]
    
    def cancel_request(self, request_id: str) -> bool:
        """Cancel a tracked request.
        
        Args:
            request_id: Request to cancel
            
        Returns:
            True if request was cancelled, False if not found
        """
        if request_id in self._active_tasks:
            task = self._active_tasks[request_id]
            task.cancel()
            del self._active_tasks[request_id]
            return True
        return False


@dataclass
class CacheEntry:
    """Cache entry with TTL support."""
    
    key: str
    value: Any
    created_at: datetime
    ttl_seconds: int
    
    def is_expired(self) -> bool:
        """Check if cache entry has expired."""
        expiry_time = self.created_at + timedelta(seconds=self.ttl_seconds)
        return datetime.now() > expiry_time


class RequestCache:
    """Simple in-memory cache for frequently asked questions.
    
    Caches responses with TTL to improve performance for repeated queries.
    """
    
    def __init__(self, default_ttl_seconds: int = 300):
        """Initialize request cache.
        
        Args:
            default_ttl_seconds: Default time-to-live for cache entries (5 minutes)
        """
        self.default_ttl_seconds = default_ttl_seconds
        self._cache: Dict[str, CacheEntry] = {}
        self._hits = 0
        self._misses = 0
    
    def _generate_key(self, query: str, context: Optional[Dict] = None) -> str:
        """Generate cache key from query and context.
        
        Args:
            query: User query
            context: Optional context dictionary
            
        Returns:
            Hash-based cache key
        """
        # Create deterministic string from query and context
        cache_data = {
            'query': query.strip().lower(),
            'context': context or {}
        }
        cache_str = json.dumps(cache_data, sort_keys=True)
        
        # Generate hash
        return hashlib.sha256(cache_str.encode()).hexdigest()
    
    def get(
        self,
        query: str,
        context: Optional[Dict] = None
    ) -> Optional[Any]:
        """Retrieve cached response if available and not expired.
        
        Args:
            query: User query
            context: Optional context dictionary
            
        Returns:
            Cached response or None if not found/expired
        """
        key = self._generate_key(query, context)
        
        if key in self._cache:
            entry = self._cache[key]
            
            if entry.is_expired():
                # Remove expired entry
                del self._cache[key]
                self._misses += 1
                return None
            
            self._hits += 1
            return entry.value
        
        self._misses += 1
        return None
    
    def set(
        self,
        query: str,
        response: Any,
        context: Optional[Dict] = None,
        ttl_seconds: Optional[int] = None
    ) -> None:
        """Store response in cache.
        
        Args:
            query: User query
            response: Response to cache
            context: Optional context dictionary
            ttl_seconds: Time-to-live in seconds (uses default if None)
        """
        key = self._generate_key(query, context)
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        
        entry = CacheEntry(
            key=key,
            value=response,
            created_at=datetime.now(),
            ttl_seconds=ttl
        )
        
        self._cache[key] = entry
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self._hits = 0
        self._misses = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        total_requests = self._hits + self._misses
        hit_rate = self._hits / total_requests if total_requests > 0 else 0.0
        
        return {
            'hits': self._hits,
            'misses': self._misses,
            'total_requests': total_requests,
            'hit_rate': hit_rate,
            'cache_size': len(self._cache)
        }


class StreamingResponse:
    """Handles streaming responses for long-form content.
    
    Sends response chunks progressively instead of waiting for completion.
    """
    
    # Threshold for considering content "long-form" (500 characters)
    LONG_FORM_THRESHOLD = 500
    
    @staticmethod
    def should_stream(content_length_estimate: int) -> bool:
        """Determine if content should be streamed.
        
        Args:
            content_length_estimate: Estimated length of content in characters
            
        Returns:
            True if content should be streamed
        """
        return content_length_estimate > StreamingResponse.LONG_FORM_THRESHOLD
    
    @staticmethod
    async def stream_text(
        text: str,
        chunk_size: int = 50
    ) -> AsyncIterator[str]:
        """Stream text in chunks.
        
        Args:
            text: Full text to stream
            chunk_size: Number of characters per chunk
            
        Yields:
            Text chunks
        """
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i + chunk_size]
            yield chunk
            await asyncio.sleep(0.01)  # Small delay for streaming effect
    
    @staticmethod
    async def stream_generator(
        generator: AsyncIterator[str]
    ) -> AsyncIterator[str]:
        """Stream from an async generator.
        
        Args:
            generator: Async generator producing text chunks
            
        Yields:
            Text chunks from generator
        """
        async for chunk in generator:
            yield chunk


class ParallelExecutor:
    """Executes independent tool calls in parallel.
    
    Identifies independent operations and runs them concurrently.
    """
    
    @staticmethod
    async def execute_parallel(
        operations: List[Callable],
        max_concurrent: int = 5
    ) -> List[Any]:
        """Execute operations in parallel with concurrency limit.
        
        Args:
            operations: List of async callables to execute
            max_concurrent: Maximum number of concurrent operations
            
        Returns:
            List of results in same order as operations
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def execute_with_semaphore(op: Callable) -> Any:
            async with semaphore:
                return await op()
        
        # Execute all operations concurrently
        tasks = [execute_with_semaphore(op) for op in operations]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return results
    
    @staticmethod
    def identify_independent_operations(
        operations: List[Dict[str, Any]]
    ) -> List[List[int]]:
        """Identify which operations can run in parallel.
        
        Args:
            operations: List of operation dictionaries with dependencies
            
        Returns:
            List of groups where each group contains indices of
            operations that can run in parallel
        """
        # Simple dependency analysis
        # Operations are independent if they don't share dependencies
        
        groups = []
        remaining = set(range(len(operations)))
        
        while remaining:
            # Find operations with no dependencies on remaining operations
            independent = []
            
            for idx in remaining:
                op = operations[idx]
                dependencies = set(op.get('depends_on', []))
                
                # Check if all dependencies are already processed
                if not dependencies.intersection(remaining):
                    independent.append(idx)
            
            if not independent:
                # Circular dependency or error, process one at a time
                independent = [min(remaining)]
            
            groups.append(independent)
            remaining -= set(independent)
        
        return groups


# Global instances for convenience
progress_indicator = ProgressIndicator()
request_cache = RequestCache()
parallel_executor = ParallelExecutor()
