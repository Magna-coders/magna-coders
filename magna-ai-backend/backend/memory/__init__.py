"""
Memory System Module

Hybrid memory combining episodic (conversation history) and semantic (vector embeddings) storage.
"""

from .system import MemorySystem
from .storage import StorageBackend, FileStorageBackend
from .embeddings import EmbeddingModel, SentenceTransformerEmbedding, OpenAIEmbedding

__all__ = [
    "MemorySystem",
    "StorageBackend",
    "FileStorageBackend",
    "EmbeddingModel",
    "SentenceTransformerEmbedding",
    "OpenAIEmbedding",
]
