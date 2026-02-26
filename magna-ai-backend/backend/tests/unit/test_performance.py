"""
Unit tests for performance optimization utilities.

Tests progress indicators, request caching, streaming, and parallel execution.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock

from ...utils.performance import (
    ProgressIndicator,
    ProgressUpdate,
    RequestCache,
    CacheEntry,
    StreamingResponse,
    ParallelExecutor
)


class TestProgressIndicator:
    """Test progress indicator functionality."""
    
    @pytest.mark.asyncio
    async def test_fast_request_no_progress(self):
        """Test that fast requests don't show progress indicators."""
        indicator = ProgressIndicator(threshold_seconds=2.0)
        
        async def fast_operation():
            await asyncio.sleep(0.1)
            return "result"
        
        results = []
        async for item in indicator.track_request(
            request_id="test1",
            operation=fast_operation
        ):
            results.append(item)
        
        # Should only get the result, no progress updates
        assert len(results) == 1
        assert results[0] == "result"
    
    @pytest.mark.asyncio
    async def test_slow_request_shows_progress(self):
        """Test that slow requests show progress indicators."""
        indicator = ProgressIndicator(threshold_seconds=0.5)
        
        async def slow_operation():
            await asyncio.sleep(1.5)
            return "result"
        
        results = []
        async for item in indicator.track_request(
            request_id="test2",
            operation=slow_operation
        ):
            results.append(item)
        
        # Should get progress updates followed by result
        assert len(results) > 1
        
        # Check for progress updates
        progress_updates = [r for r in results if isinstance(r, ProgressUpdate)]
        assert len(progress_updates) > 0
        
        # Check final result
        assert results[-1] == "result"
    
    @pytest.mark.asyncio
    async def test_cancel_request(self):
        """Test cancelling a tracked request."""
        indicator = ProgressIndicator(threshold_seconds=0.5)
        
        async def long_operation():
            await asyncio.sleep(10)
            return "result"
        
        # Start tracking
        task = asyncio.create_task(
            indicator.track_request(
                request_id="test3",
                operation=long_operation
            ).__anext__()
        )
        
        # Give it time to start
        await asyncio.sleep(0.1)
        
        # Cancel
        cancelled = indicator.cancel_request("test3")
        assert cancelled is True
        
        # Verify task was cancelled
        with pytest.raises(asyncio.CancelledError):
            await task


class TestRequestCache:
    """Test request caching functionality."""
    
    def test_cache_miss(self):
        """Test cache miss returns None."""
        cache = RequestCache()
        
        result = cache.get("test query")
        assert result is None
    
    def test_cache_hit(self):
        """Test cache hit returns stored value."""
        cache = RequestCache()
        
        # Store value
        cache.set("test query", "response", ttl_seconds=60)
        
        # Retrieve value
        result = cache.get("test query")
        assert result == "response"
    
    def test_cache_expiration(self):
        """Test that expired entries are removed."""
        cache = RequestCache(default_ttl_seconds=1)
        
        # Store value with short TTL
        cache.set("test query", "response", ttl_seconds=0)
        
        # Should be expired immediately
        result = cache.get("test query")
        assert result is None
    
    def test_cache_with_context(self):
        """Test caching with context differentiation."""
        cache = RequestCache()
        
        # Store same query with different contexts
        cache.set("query", "response1", context={"user": "user1"})
        cache.set("query", "response2", context={"user": "user2"})
        
        # Retrieve with contexts
        result1 = cache.get("query", context={"user": "user1"})
        result2 = cache.get("query", context={"user": "user2"})
        
        assert result1 == "response1"
        assert result2 == "response2"
    
    def test_cache_stats(self):
        """Test cache statistics tracking."""
        cache = RequestCache()
        
        # Generate some hits and misses
        cache.set("query1", "response1")
        cache.get("query1")  # Hit
        cache.get("query2")  # Miss
        cache.get("query1")  # Hit
        cache.get("query3")  # Miss
        
        stats = cache.get_stats()
        
        assert stats['hits'] == 2
        assert stats['misses'] == 2
        assert stats['total_requests'] == 4
        assert stats['hit_rate'] == 0.5
        assert stats['cache_size'] == 1
    
    def test_cache_clear(self):
        """Test clearing cache."""
        cache = RequestCache()
        
        cache.set("query1", "response1")
        cache.set("query2", "response2")
        
        cache.clear()
        
        assert cache.get("query1") is None
        assert cache.get("query2") is None
        
        stats = cache.get_stats()
        assert stats['cache_size'] == 0


class TestStreamingResponse:
    """Test streaming response functionality."""
    
    def test_should_stream_long_content(self):
        """Test that long content should be streamed."""
        assert StreamingResponse.should_stream(600) is True
    
    def test_should_not_stream_short_content(self):
        """Test that short content should not be streamed."""
        assert StreamingResponse.should_stream(400) is False
    
    @pytest.mark.asyncio
    async def test_stream_text(self):
        """Test streaming text in chunks."""
        text = "Hello, this is a test message for streaming."
        chunks = []
        
        async for chunk in StreamingResponse.stream_text(text, chunk_size=10):
            chunks.append(chunk)
        
        # Verify chunks
        assert len(chunks) > 1
        assert "".join(chunks) == text
    
    @pytest.mark.asyncio
    async def test_stream_generator(self):
        """Test streaming from async generator."""
        async def test_generator():
            for i in range(5):
                yield f"chunk{i}"
        
        chunks = []
        async for chunk in StreamingResponse.stream_generator(test_generator()):
            chunks.append(chunk)
        
        assert chunks == ["chunk0", "chunk1", "chunk2", "chunk3", "chunk4"]


class TestParallelExecutor:
    """Test parallel execution functionality."""
    
    @pytest.mark.asyncio
    async def test_execute_parallel(self):
        """Test parallel execution of operations."""
        async def operation(value: int):
            await asyncio.sleep(0.1)
            return value * 2
        
        operations = [
            lambda v=i: operation(v)
            for i in range(5)
        ]
        
        results = await ParallelExecutor.execute_parallel(operations)
        
        assert results == [0, 2, 4, 6, 8]
    
    @pytest.mark.asyncio
    async def test_execute_parallel_with_errors(self):
        """Test parallel execution handles errors."""
        async def failing_operation():
            raise ValueError("Test error")
        
        async def success_operation():
            return "success"
        
        operations = [
            failing_operation,
            success_operation,
            failing_operation
        ]
        
        results = await ParallelExecutor.execute_parallel(operations)
        
        # Check that we got results for all operations
        assert len(results) == 3
        
        # Check error handling
        assert isinstance(results[0], ValueError)
        assert results[1] == "success"
        assert isinstance(results[2], ValueError)
    
    @pytest.mark.asyncio
    async def test_execute_parallel_respects_concurrency_limit(self):
        """Test that concurrency limit is respected."""
        concurrent_count = 0
        max_concurrent = 0
        
        async def tracked_operation():
            nonlocal concurrent_count, max_concurrent
            concurrent_count += 1
            max_concurrent = max(max_concurrent, concurrent_count)
            await asyncio.sleep(0.1)
            concurrent_count -= 1
            return "done"
        
        operations = [tracked_operation for _ in range(10)]
        
        await ParallelExecutor.execute_parallel(
            operations,
            max_concurrent=3
        )
        
        # Verify concurrency was limited
        assert max_concurrent <= 3
    
    def test_identify_independent_operations(self):
        """Test identifying independent operations."""
        operations = [
            {"name": "op1", "depends_on": []},
            {"name": "op2", "depends_on": []},
            {"name": "op3", "depends_on": [0]},
            {"name": "op4", "depends_on": [1]},
            {"name": "op5", "depends_on": [2, 3]}
        ]
        
        groups = ParallelExecutor.identify_independent_operations(operations)
        
        # First group should have op1 and op2 (no dependencies)
        assert set(groups[0]) == {0, 1}
        
        # Second group should have op3 and op4 (depend on first group)
        assert set(groups[1]) == {2, 3}
        
        # Third group should have op5 (depends on second group)
        assert groups[2] == [4]


class TestCacheEntry:
    """Test cache entry functionality."""
    
    def test_cache_entry_not_expired(self):
        """Test that fresh cache entry is not expired."""
        entry = CacheEntry(
            key="test",
            value="data",
            created_at=datetime.now(),
            ttl_seconds=60
        )
        
        assert entry.is_expired() is False
    
    def test_cache_entry_expired(self):
        """Test that old cache entry is expired."""
        entry = CacheEntry(
            key="test",
            value="data",
            created_at=datetime.now() - timedelta(seconds=120),
            ttl_seconds=60
        )
        
        assert entry.is_expired() is True


class TestProgressUpdate:
    """Test progress update functionality."""
    
    def test_progress_update_creation(self):
        """Test creating progress update."""
        update = ProgressUpdate(
            message="Processing...",
            progress_percent=50
        )
        
        assert update.message == "Processing..."
        assert update.progress_percent == 50
        assert update.timestamp is not None
    
    def test_progress_update_to_dict(self):
        """Test converting progress update to dictionary."""
        update = ProgressUpdate(
            message="Processing...",
            progress_percent=75
        )
        
        data = update.to_dict()
        
        assert data['message'] == "Processing..."
        assert data['progress_percent'] == 75
        assert 'timestamp' in data
