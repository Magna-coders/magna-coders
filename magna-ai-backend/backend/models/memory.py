"""
Memory data models for episodic and semantic storage.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum


class MemoryType(str, Enum):
    """Type of memory entry."""
    EPISODIC = "episodic"  # Conversation history
    SEMANTIC = "semantic"  # Vector embeddings


@dataclass
class MemoryMetadata:
    """Metadata associated with a memory entry."""
    tool_calls: List[str] = field(default_factory=list)
    entities_mentioned: List[str] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    sentiment: float = 0.0  # -1.0 to 1.0
    user_satisfaction: Optional[float] = None  # 0.0 to 1.0


@dataclass
class MemoryEntry:
    """
    A single memory entry combining episodic and semantic information.
    
    Attributes:
        id: Unique identifier for the memory entry
        user_id: User who owns this memory
        conversation_id: Conversation this memory belongs to
        timestamp: When this interaction occurred
        user_message: User's input message
        agent_response: Agent's response
        embedding: Vector embedding for semantic search (768-dim)
        importance_score: Score for pruning decisions (0.0 to 1.0)
        metadata: Additional context about the interaction
        memory_type: Type of memory (episodic or semantic)
    """
    id: str
    user_id: str
    conversation_id: str
    timestamp: datetime
    user_message: str
    agent_response: str
    embedding: Optional[List[float]] = None
    importance_score: float = 0.5
    metadata: MemoryMetadata = field(default_factory=MemoryMetadata)
    memory_type: MemoryType = MemoryType.EPISODIC
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert memory entry to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "conversation_id": self.conversation_id,
            "timestamp": self.timestamp.isoformat(),
            "user_message": self.user_message,
            "agent_response": self.agent_response,
            "embedding": self.embedding,
            "importance_score": self.importance_score,
            "metadata": {
                "tool_calls": self.metadata.tool_calls,
                "entities_mentioned": self.metadata.entities_mentioned,
                "topics": self.metadata.topics,
                "sentiment": self.metadata.sentiment,
                "user_satisfaction": self.metadata.user_satisfaction,
            },
            "memory_type": self.memory_type.value,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryEntry":
        """Create memory entry from dictionary."""
        metadata_dict = data.get("metadata", {})
        metadata = MemoryMetadata(
            tool_calls=metadata_dict.get("tool_calls", []),
            entities_mentioned=metadata_dict.get("entities_mentioned", []),
            topics=metadata_dict.get("topics", []),
            sentiment=metadata_dict.get("sentiment", 0.0),
            user_satisfaction=metadata_dict.get("user_satisfaction"),
        )
        
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            conversation_id=data["conversation_id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            user_message=data["user_message"],
            agent_response=data["agent_response"],
            embedding=data.get("embedding"),
            importance_score=data.get("importance_score", 0.5),
            metadata=metadata,
            memory_type=MemoryType(data.get("memory_type", "episodic")),
        )
    
    def size_bytes(self) -> int:
        """Calculate approximate size of this memory entry in bytes."""
        size = 0
        size += len(self.id.encode('utf-8'))
        size += len(self.user_id.encode('utf-8'))
        size += len(self.conversation_id.encode('utf-8'))
        size += len(self.user_message.encode('utf-8'))
        size += len(self.agent_response.encode('utf-8'))
        
        # Embedding size (768 floats * 4 bytes per float)
        if self.embedding:
            size += len(self.embedding) * 4
        
        # Metadata (approximate)
        for tool_call in self.metadata.tool_calls:
            size += len(tool_call.encode('utf-8'))
        for entity in self.metadata.entities_mentioned:
            size += len(entity.encode('utf-8'))
        for topic in self.metadata.topics:
            size += len(topic.encode('utf-8'))
        
        return size
