"""
Storage backends for memory system.

Provides abstraction for different storage mechanisms (file-based, database, etc.)
"""

import json
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..models.memory import MemoryEntry


class StorageBackend(ABC):
    """Abstract base class for memory storage backends."""
    
    @abstractmethod
    async def store(self, entry: MemoryEntry) -> None:
        """Store a memory entry."""
        pass
    
    @abstractmethod
    async def retrieve_by_conversation(
        self,
        user_id: str,
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[MemoryEntry]:
        """Retrieve memory entries for a specific conversation."""
        pass
    
    @abstractmethod
    async def retrieve_by_user(
        self,
        user_id: str,
        limit: Optional[int] = None
    ) -> List[MemoryEntry]:
        """Retrieve all memory entries for a user."""
        pass
    
    @abstractmethod
    async def search_by_embedding(
        self,
        user_id: str,
        query_embedding: List[float],
        limit: int = 5
    ) -> List[MemoryEntry]:
        """Search for similar memories using vector similarity."""
        pass
    
    @abstractmethod
    async def delete_oldest(self, user_id: str, count: int) -> int:
        """Delete the oldest memory entries for a user."""
        pass
    
    @abstractmethod
    async def get_total_size(self, user_id: str) -> int:
        """Get total storage size in bytes for a user."""
        pass
    
    @abstractmethod
    async def clear_user_memory(self, user_id: str) -> None:
        """Clear all memory for a user."""
        pass


class FileStorageBackend(StorageBackend):
    """
    File-based storage backend for memory entries.
    
    Stores memories as JSON files in a directory structure:
    storage_dir/
        {user_id}/
            {conversation_id}/
                {entry_id}.json
    """
    
    def __init__(self, storage_dir: str = "./memory_storage"):
        """
        Initialize file storage backend.
        
        Args:
            storage_dir: Base directory for storing memory files
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_user_dir(self, user_id: str) -> Path:
        """Get directory path for a user."""
        user_dir = self.storage_dir / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    def _get_conversation_dir(self, user_id: str, conversation_id: str) -> Path:
        """Get directory path for a conversation."""
        conv_dir = self._get_user_dir(user_id) / conversation_id
        conv_dir.mkdir(parents=True, exist_ok=True)
        return conv_dir
    
    def _get_entry_path(self, entry: MemoryEntry) -> Path:
        """Get file path for a memory entry."""
        conv_dir = self._get_conversation_dir(entry.user_id, entry.conversation_id)
        return conv_dir / f"{entry.id}.json"
    
    async def store(self, entry: MemoryEntry) -> None:
        """Store a memory entry as a JSON file."""
        entry_path = self._get_entry_path(entry)
        
        with open(entry_path, 'w', encoding='utf-8') as f:
            json.dump(entry.to_dict(), f, indent=2, ensure_ascii=False)
    
    async def retrieve_by_conversation(
        self,
        user_id: str,
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[MemoryEntry]:
        """Retrieve memory entries for a specific conversation."""
        conv_dir = self._get_conversation_dir(user_id, conversation_id)
        
        if not conv_dir.exists():
            return []
        
        entries = []
        for entry_file in conv_dir.glob("*.json"):
            with open(entry_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                entries.append(MemoryEntry.from_dict(data))
        
        # Sort by timestamp (newest first)
        entries.sort(key=lambda e: e.timestamp, reverse=True)
        
        if limit:
            entries = entries[:limit]
        
        return entries
    
    async def retrieve_by_user(
        self,
        user_id: str,
        limit: Optional[int] = None
    ) -> List[MemoryEntry]:
        """Retrieve all memory entries for a user."""
        user_dir = self._get_user_dir(user_id)
        
        if not user_dir.exists():
            return []
        
        entries = []
        for conv_dir in user_dir.iterdir():
            if conv_dir.is_dir():
                for entry_file in conv_dir.glob("*.json"):
                    with open(entry_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        entries.append(MemoryEntry.from_dict(data))
        
        # Sort by timestamp (newest first)
        entries.sort(key=lambda e: e.timestamp, reverse=True)
        
        if limit:
            entries = entries[:limit]
        
        return entries
    
    async def search_by_embedding(
        self,
        user_id: str,
        query_embedding: List[float],
        limit: int = 5
    ) -> List[MemoryEntry]:
        """
        Search for similar memories using cosine similarity.
        
        Args:
            user_id: User ID to search within
            query_embedding: Query vector embedding
            limit: Maximum number of results
            
        Returns:
            List of memory entries sorted by similarity (highest first)
        """
        entries = await self.retrieve_by_user(user_id)
        
        # Filter entries with embeddings
        entries_with_embeddings = [e for e in entries if e.embedding is not None]
        
        if not entries_with_embeddings:
            return []
        
        # Calculate cosine similarity for each entry
        similarities = []
        for entry in entries_with_embeddings:
            similarity = self._cosine_similarity(query_embedding, entry.embedding)
            similarities.append((entry, similarity))
        
        # Sort by similarity (highest first)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top N entries
        return [entry for entry, _ in similarities[:limit]]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    async def delete_oldest(self, user_id: str, count: int) -> int:
        """Delete the oldest memory entries for a user."""
        entries = await self.retrieve_by_user(user_id)
        
        # Sort by timestamp (oldest first)
        entries.sort(key=lambda e: e.timestamp)
        
        # Delete oldest entries
        deleted_count = 0
        for entry in entries[:count]:
            entry_path = self._get_entry_path(entry)
            if entry_path.exists():
                entry_path.unlink()
                deleted_count += 1
        
        return deleted_count
    
    async def get_total_size(self, user_id: str) -> int:
        """Get total storage size in bytes for a user."""
        entries = await self.retrieve_by_user(user_id)
        return sum(entry.size_bytes() for entry in entries)
    
    async def clear_user_memory(self, user_id: str) -> None:
        """Clear all memory for a user."""
        user_dir = self._get_user_dir(user_id)
        
        if user_dir.exists():
            # Remove all files and subdirectories
            for conv_dir in user_dir.iterdir():
                if conv_dir.is_dir():
                    for entry_file in conv_dir.glob("*.json"):
                        entry_file.unlink()
                    conv_dir.rmdir()
            user_dir.rmdir()
