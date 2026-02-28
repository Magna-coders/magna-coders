"""
Unit tests for Memory System.
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

from ...memory import MemorySystem, FileStorageBackend
from ...memory.embeddings_mock import MockEmbeddingModel
from ...models.memory import MemoryEntry, MemoryMetadata


@pytest.fixture
def temp_storage_dir():
    """Create a temporary directory for test storage."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Cleanup after test
    shutil.rmtree(temp_dir)


@pytest.fixture
def memory_system(temp_storage_dir):
    """Create a memory system instance for testing."""
    storage = FileStorageBackend(storage_dir=temp_storage_dir)
    # Use mock embedding model for testing (sentence-transformers requires PyTorch)
    embedding = MockEmbeddingModel(embedding_dim=384)
    return MemorySystem(
        storage_backend=storage,
        embedding_model=embedding,
        max_size_mb=5
    )


@pytest.mark.asyncio
async def test_store_interaction(memory_system):
    """Test storing a conversation interaction."""
    entry = await memory_system.store_interaction(
        user_id="test_user_1",
        conversation_id="conv_1",
        user_message="Hello, can you help me find Python jobs?",
        agent_response="Of course! I can help you find Python jobs. Let me search for opportunities.",
        metadata={
            "tool_calls": ["search_jobs"],
            "topics": ["jobs", "python"],
        }
    )
    
    assert entry is not None
    assert entry.user_id == "test_user_1"
    assert entry.conversation_id == "conv_1"
    assert entry.user_message == "Hello, can you help me find Python jobs?"
    assert entry.embedding is not None
    assert len(entry.embedding) > 0
    assert 0.0 <= entry.importance_score <= 1.0


@pytest.mark.asyncio
async def test_retrieve_context(memory_system):
    """Test retrieving context with hybrid search."""
    # Store multiple interactions
    await memory_system.store_interaction(
        user_id="test_user_2",
        conversation_id="conv_2",
        user_message="I'm looking for Python jobs in Kenya",
        agent_response="Here are some Python jobs in Kenya...",
    )
    
    await memory_system.store_interaction(
        user_id="test_user_2",
        conversation_id="conv_2",
        user_message="What about remote opportunities?",
        agent_response="Here are remote Python opportunities...",
    )
    
    await memory_system.store_interaction(
        user_id="test_user_2",
        conversation_id="conv_2",
        user_message="Can you show me senior positions?",
        agent_response="Here are senior Python positions...",
    )
    
    # Retrieve context
    context = await memory_system.retrieve_context(
        user_id="test_user_2",
        conversation_id="conv_2",
        query="Show me Python jobs",
        max_results=5
    )
    
    assert len(context) > 0
    assert all(entry.user_id == "test_user_2" for entry in context)


@pytest.mark.asyncio
async def test_memory_size_limit(memory_system):
    """Test that memory size limit is enforced."""
    # Store many interactions to exceed limit
    for i in range(100):
        await memory_system.store_interaction(
            user_id="test_user_3",
            conversation_id=f"conv_{i}",
            user_message=f"Message {i} " * 100,  # Long message
            agent_response=f"Response {i} " * 100,
        )
    
    # Check that size is within limit
    stats = await memory_system.get_memory_stats("test_user_3")
    assert stats["total_size_mb"] <= memory_system.max_size_mb


@pytest.mark.asyncio
async def test_prune_memory(memory_system):
    """Test memory pruning functionality."""
    # Store interactions
    for i in range(10):
        await memory_system.store_interaction(
            user_id="test_user_4",
            conversation_id="conv_4",
            user_message=f"Message {i}",
            agent_response=f"Response {i}",
        )
    
    # Get initial count
    initial_stats = await memory_system.get_memory_stats("test_user_4")
    initial_count = initial_stats["total_entries"]
    
    # Manually trigger pruning
    pruned_count = await memory_system.prune_memory("test_user_4")
    
    # Verify some entries were pruned (if size exceeded limit)
    final_stats = await memory_system.get_memory_stats("test_user_4")
    
    # If pruning occurred, count should be less
    if pruned_count > 0:
        assert final_stats["total_entries"] < initial_count


@pytest.mark.asyncio
async def test_sync_to_backend(memory_system):
    """Test encrypting and syncing memory to backend."""
    # Store some interactions
    await memory_system.store_interaction(
        user_id="test_user_5",
        conversation_id="conv_5",
        user_message="Test message",
        agent_response="Test response",
    )
    
    # Generate a valid AES-256 encryption key
    from ...utils.encryption import generate_encryption_key
    encryption_key = generate_encryption_key()
    
    # Sync to backend
    result = await memory_system.sync_to_backend(
        user_id="test_user_5",
        encryption_key=encryption_key
    )
    
    assert result["status"] == "success"
    assert result["user_id"] == "test_user_5"
    assert result["entry_count"] > 0
    assert "encrypted_data" in result


@pytest.mark.asyncio
async def test_encryption_decryption_roundtrip(memory_system, temp_storage_dir):
    """Test complete encryption/decryption cycle with backend sync and load."""
    from ...utils.encryption import generate_encryption_key
    
    # Store multiple interactions
    user_id = "test_user_encrypt"
    conversation_id = "conv_encrypt"
    
    for i in range(3):
        await memory_system.store_interaction(
            user_id=user_id,
            conversation_id=conversation_id,
            user_message=f"User message {i}",
            agent_response=f"Agent response {i}",
            metadata={"topics": [f"topic_{i}"]}
        )
    
    # Generate encryption key
    encryption_key = generate_encryption_key()
    
    # Sync to backend (encrypt)
    sync_result = await memory_system.sync_to_backend(
        user_id=user_id,
        encryption_key=encryption_key
    )
    
    assert sync_result["status"] == "success"
    assert sync_result["entry_count"] == 3
    encrypted_data = sync_result["encrypted_data"]
    assert isinstance(encrypted_data, bytes)
    assert len(encrypted_data) > 0
    
    # Create a new memory system with fresh storage
    new_storage_dir = tempfile.mkdtemp()
    try:
        new_storage = FileStorageBackend(storage_dir=new_storage_dir)
        new_memory_system = MemorySystem(
            storage_backend=new_storage,
            embedding_model=MockEmbeddingModel(embedding_dim=384)
        )
        
        # Load from backend (decrypt)
        loaded_count = await new_memory_system.load_from_backend(
            user_id=user_id,
            encrypted_data=encrypted_data,
            encryption_key=encryption_key
        )
        
        assert loaded_count == 3
        
        # Verify loaded data matches original
        loaded_entries = await new_storage.retrieve_by_user(user_id)
        assert len(loaded_entries) == 3
        
        # Check that messages were preserved
        messages = [entry.user_message for entry in loaded_entries]
        assert "User message 0" in messages
        assert "User message 1" in messages
        assert "User message 2" in messages
        
    finally:
        shutil.rmtree(new_storage_dir)


@pytest.mark.asyncio
async def test_encryption_with_wrong_key_fails(memory_system):
    """Test that decryption with wrong key fails."""
    from ...utils.encryption import generate_encryption_key
    from cryptography.exceptions import InvalidTag
    
    # Store interaction
    await memory_system.store_interaction(
        user_id="test_user_wrong_key",
        conversation_id="conv_wrong_key",
        user_message="Secret message",
        agent_response="Secret response",
    )
    
    # Encrypt with one key
    key1 = generate_encryption_key()
    sync_result = await memory_system.sync_to_backend(
        user_id="test_user_wrong_key",
        encryption_key=key1
    )
    
    encrypted_data = sync_result["encrypted_data"]
    
    # Try to decrypt with different key
    key2 = generate_encryption_key()
    
    with pytest.raises(InvalidTag):
        await memory_system.load_from_backend(
            user_id="test_user_wrong_key",
            encrypted_data=encrypted_data,
            encryption_key=key2
        )


@pytest.mark.asyncio
async def test_get_memory_stats(memory_system):
    """Test getting memory statistics."""
    # Store some interactions
    for i in range(5):
        await memory_system.store_interaction(
            user_id="test_user_6",
            conversation_id="conv_6",
            user_message=f"Message {i}",
            agent_response=f"Response {i}",
        )
    
    # Get stats
    stats = await memory_system.get_memory_stats("test_user_6")
    
    assert stats["user_id"] == "test_user_6"
    assert stats["total_entries"] == 5
    assert stats["total_size_bytes"] > 0
    assert stats["total_size_mb"] > 0
    assert 0 <= stats["usage_percentage"] <= 100
    assert stats["oldest_entry"] is not None
    assert stats["newest_entry"] is not None


@pytest.mark.asyncio
async def test_importance_calculation(memory_system):
    """Test that importance scores are calculated correctly."""
    # Store interaction with tool calls (should have higher importance)
    entry1 = await memory_system.store_interaction(
        user_id="test_user_7",
        conversation_id="conv_7",
        user_message="Find me jobs",
        agent_response="Here are the jobs...",
        metadata={
            "tool_calls": ["search_jobs", "match_opportunities"],
            "entities_mentioned": ["Python", "Kenya", "Remote"],
        }
    )
    
    # Store simple interaction (should have lower importance)
    entry2 = await memory_system.store_interaction(
        user_id="test_user_7",
        conversation_id="conv_7",
        user_message="Thanks",
        agent_response="You're welcome!",
    )
    
    # Entry with tool calls should have higher importance
    assert entry1.importance_score > entry2.importance_score
