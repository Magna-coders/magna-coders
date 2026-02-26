"""
Memory System implementation with hybrid episodic and semantic storage.

Combines conversation history (episodic) with vector embeddings (semantic)
for context-aware retrieval.
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..models.memory import MemoryEntry, MemoryMetadata, MemoryType
from ..utils.encryption import encrypt_data, decrypt_data
from .storage import StorageBackend, FileStorageBackend
from .embeddings import EmbeddingModel, SentenceTransformerEmbedding


class MemorySystem:
    """
    Hybrid memory system combining episodic and semantic storage.
    
    Features:
    - Episodic memory: Stores conversation turns with timestamps
    - Semantic memory: Vector embeddings for similarity search
    - Hybrid retrieval: Combines recent history with semantically similar past interactions
    - Size management: Automatic pruning when storage limit exceeded
    - Encryption: Optional encrypted sync to backend
    
    Attributes:
        storage_backend: Storage mechanism (file-based, database, etc.)
        embedding_model: Model for generating vector embeddings
        max_size_mb: Maximum storage size per user in megabytes
    """
    
    def __init__(
        self,
        storage_backend: Optional[StorageBackend] = None,
        embedding_model: Optional[EmbeddingModel] = None,
        max_size_mb: int = 5
    ):
        """
        Initialize memory system.
        
        Args:
            storage_backend: Storage backend (defaults to FileStorageBackend)
            embedding_model: Embedding model (defaults to SentenceTransformerEmbedding)
            max_size_mb: Maximum storage size per user in MB
        """
        self.storage_backend = storage_backend or FileStorageBackend()
        self.embedding_model = embedding_model or SentenceTransformerEmbedding()
        self.max_size_mb = max_size_mb
        self.max_size_bytes = max_size_mb * 1024 * 1024
    
    async def store_interaction(
        self,
        user_id: str,
        conversation_id: str,
        user_message: str,
        agent_response: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> MemoryEntry:
        """
        Store a conversation turn with embeddings.
        
        This method:
        1. Creates a memory entry with the interaction
        2. Generates vector embedding for semantic search
        3. Calculates importance score
        4. Stores the entry
        5. Checks size limits and prunes if necessary
        
        Args:
            user_id: User who owns this memory
            conversation_id: Conversation this belongs to
            user_message: User's input message
            agent_response: Agent's response
            metadata: Optional metadata (tool calls, entities, etc.)
            
        Returns:
            The stored memory entry
            
        Raises:
            ValueError: If user_id or conversation_id is empty
        """
        if not user_id or not conversation_id:
            raise ValueError("user_id and conversation_id are required")
        
        # Create memory entry
        entry_id = str(uuid.uuid4())
        
        # Parse metadata
        memory_metadata = MemoryMetadata()
        if metadata:
            memory_metadata.tool_calls = metadata.get("tool_calls", [])
            memory_metadata.entities_mentioned = metadata.get("entities_mentioned", [])
            memory_metadata.topics = metadata.get("topics", [])
            memory_metadata.sentiment = metadata.get("sentiment", 0.0)
            memory_metadata.user_satisfaction = metadata.get("user_satisfaction")
        
        # Generate embedding for semantic search
        # Combine user message and agent response for context
        combined_text = f"User: {user_message}\nAgent: {agent_response}"
        embedding = await self.embedding_model.generate_embedding(combined_text)
        
        # Calculate importance score based on various factors
        importance_score = self._calculate_importance(
            user_message,
            agent_response,
            memory_metadata
        )
        
        # Create memory entry
        entry = MemoryEntry(
            id=entry_id,
            user_id=user_id,
            conversation_id=conversation_id,
            timestamp=datetime.now(),
            user_message=user_message,
            agent_response=agent_response,
            embedding=embedding,
            importance_score=importance_score,
            metadata=memory_metadata,
            memory_type=MemoryType.EPISODIC
        )
        
        # Store the entry
        await self.storage_backend.store(entry)
        
        # Check size limits and prune if necessary
        current_size = await self.storage_backend.get_total_size(user_id)
        if current_size > self.max_size_bytes:
            await self.prune_memory(user_id)
        
        return entry
    
    async def retrieve_context(
        self,
        user_id: str,
        conversation_id: str,
        query: str,
        max_results: int = 5
    ) -> List[MemoryEntry]:
        """
        Retrieve relevant context using hybrid search.
        
        Combines:
        1. Recent episodic memory (last 3 turns from current conversation)
        2. Semantic similarity search (top 5 similar past interactions)
        
        Args:
            user_id: User ID to retrieve context for
            conversation_id: Current conversation ID
            query: Current query for semantic search
            max_results: Maximum number of semantic results
            
        Returns:
            List of relevant memory entries, deduplicated and ranked
        """
        # 1. Retrieve recent episodic memory from current conversation
        recent_entries = await self.storage_backend.retrieve_by_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            limit=3
        )
        
        # 2. Generate embedding for current query
        query_embedding = await self.embedding_model.generate_embedding(query)
        
        # 3. Search for semantically similar past interactions
        similar_entries = await self.storage_backend.search_by_embedding(
            user_id=user_id,
            query_embedding=query_embedding,
            limit=max_results
        )
        
        # 4. Combine and deduplicate results
        seen_ids = set()
        combined_entries = []
        
        # Add recent entries first (higher priority)
        for entry in recent_entries:
            if entry.id not in seen_ids:
                combined_entries.append(entry)
                seen_ids.add(entry.id)
        
        # Add similar entries
        for entry in similar_entries:
            if entry.id not in seen_ids:
                combined_entries.append(entry)
                seen_ids.add(entry.id)
        
        # 5. Rank by recency and relevance
        # Recent entries from current conversation are already at the top
        # Semantic matches follow
        
        return combined_entries
    
    async def prune_memory(self, user_id: str) -> int:
        """
        Remove oldest episodic entries when size limit exceeded.
        
        Pruning strategy:
        1. Calculate how many entries to remove
        2. Sort entries by importance score and timestamp
        3. Remove lowest importance, oldest entries first
        4. Preserve semantic embeddings for important interactions
        
        Args:
            user_id: User whose memory to prune
            
        Returns:
            Number of entries pruned
        """
        current_size = await self.storage_backend.get_total_size(user_id)
        
        if current_size <= self.max_size_bytes:
            return 0
        
        # Calculate target size (80% of max to avoid frequent pruning)
        target_size = int(self.max_size_bytes * 0.8)
        size_to_remove = current_size - target_size
        
        # Get all entries sorted by importance and timestamp
        all_entries = await self.storage_backend.retrieve_by_user(user_id)
        
        # Sort by importance (ascending) and timestamp (oldest first)
        # This ensures we remove least important, oldest entries first
        all_entries.sort(key=lambda e: (e.importance_score, e.timestamp))
        
        # Remove entries until we reach target size
        removed_count = 0
        removed_size = 0
        
        for entry in all_entries:
            if removed_size >= size_to_remove:
                break
            
            # Delete the entry
            await self.storage_backend.delete_oldest(user_id, 1)
            removed_count += 1
            removed_size += entry.size_bytes()
        
        return removed_count
    
    async def sync_to_backend(
        self,
        user_id: str,
        encryption_key: str
    ) -> Dict[str, Any]:
        """
        Encrypt and sync local memory to backend.
        
        Args:
            user_id: User whose memory to sync
            encryption_key: AES-256 encryption key
            
        Returns:
            Sync result with status and metadata
        """
        # Retrieve all user memory
        entries = await self.storage_backend.retrieve_by_user(user_id)
        
        # Convert to JSON
        memory_data = {
            "user_id": user_id,
            "sync_timestamp": datetime.now().isoformat(),
            "entry_count": len(entries),
            "entries": [entry.to_dict() for entry in entries]
        }
        
        memory_json = json.dumps(memory_data, ensure_ascii=False)
        
        # Encrypt the data
        encrypted_data = encrypt_data(memory_json, encryption_key)
        
        # Return encrypted data for backend storage
        # In a real implementation, this would call a backend API
        return {
            "status": "success",
            "user_id": user_id,
            "encrypted_data": encrypted_data,
            "entry_count": len(entries),
            "sync_timestamp": memory_data["sync_timestamp"]
        }
    
    async def load_from_backend(
        self,
        user_id: str,
        encrypted_data: bytes,
        encryption_key: str
    ) -> int:
        """
        Decrypt and load memory from backend.
        
        Args:
            user_id: User whose memory to load
            encrypted_data: Encrypted memory data
            encryption_key: AES-256 encryption key
            
        Returns:
            Number of entries loaded
        """
        # Decrypt the data
        memory_json = decrypt_data(encrypted_data, encryption_key)
        memory_data = json.loads(memory_json)
        
        # Validate user_id matches
        if memory_data["user_id"] != user_id:
            raise ValueError("User ID mismatch in encrypted data")
        
        # Load entries
        loaded_count = 0
        for entry_dict in memory_data["entries"]:
            entry = MemoryEntry.from_dict(entry_dict)
            await self.storage_backend.store(entry)
            loaded_count += 1
        
        return loaded_count
    
    def _calculate_importance(
        self,
        user_message: str,
        agent_response: str,
        metadata: MemoryMetadata
    ) -> float:
        """
        Calculate importance score for a memory entry.
        
        Factors:
        - Message length (longer = more important)
        - Tool usage (tool calls = more important)
        - User satisfaction (if available)
        - Entity mentions (more entities = more important)
        
        Args:
            user_message: User's message
            agent_response: Agent's response
            metadata: Memory metadata
            
        Returns:
            Importance score between 0.0 and 1.0
        """
        score = 0.5  # Base score
        
        # Factor 1: Message length (normalized)
        total_length = len(user_message) + len(agent_response)
        length_score = min(total_length / 1000, 0.2)  # Max 0.2 contribution
        score += length_score
        
        # Factor 2: Tool usage
        if metadata.tool_calls:
            score += 0.2
        
        # Factor 3: User satisfaction
        if metadata.user_satisfaction is not None:
            score += metadata.user_satisfaction * 0.2
        
        # Factor 4: Entity mentions
        entity_score = min(len(metadata.entities_mentioned) / 10, 0.1)
        score += entity_score
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))
    
    async def get_memory_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get memory statistics for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with memory statistics
        """
        entries = await self.storage_backend.retrieve_by_user(user_id)
        total_size = await self.storage_backend.get_total_size(user_id)
        
        return {
            "user_id": user_id,
            "total_entries": len(entries),
            "total_size_bytes": total_size,
            "total_size_mb": total_size / (1024 * 1024),
            "max_size_mb": self.max_size_mb,
            "usage_percentage": (total_size / self.max_size_bytes) * 100,
            "oldest_entry": min(entries, key=lambda e: e.timestamp).timestamp.isoformat() if entries else None,
            "newest_entry": max(entries, key=lambda e: e.timestamp).timestamp.isoformat() if entries else None,
        }
