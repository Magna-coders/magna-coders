"""
Mock embedding model for testing when sentence-transformers is not available.

NOTE: This is a simplified mock for testing purposes only.
In production, use SentenceTransformerEmbedding or OpenAIEmbedding.
"""

from typing import List
import hashlib


class MockEmbeddingModel:
    """
    Mock embedding model that generates deterministic embeddings based on text hash.
    
    This is NOT suitable for production use - it's only for testing when
    sentence-transformers cannot be installed (e.g., Python 3.13 where PyTorch
    is not yet available).
    
    For production, use:
    - SentenceTransformerEmbedding (requires PyTorch)
    - OpenAIEmbedding (requires OpenAI API key)
    """
    
    def __init__(self, embedding_dim: int = 384):
        """
        Initialize mock embedding model.
        
        Args:
            embedding_dim: Dimension of embeddings to generate
        """
        self.embedding_dim = embedding_dim
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate a deterministic embedding based on text hash.
        
        Args:
            text: Input text to embed
            
        Returns:
            Vector embedding as list of floats
        """
        # Generate a deterministic hash of the text
        text_hash = hashlib.sha256(text.encode('utf-8')).digest()
        
        # Convert hash bytes to floats in range [-1, 1]
        embedding = []
        for i in range(self.embedding_dim):
            # Use modulo to cycle through hash bytes
            byte_val = text_hash[i % len(text_hash)]
            # Normalize to [-1, 1]
            float_val = (byte_val / 127.5) - 1.0
            embedding.append(float_val)
        
        # Normalize the vector to unit length (for cosine similarity)
        magnitude = sum(x * x for x in embedding) ** 0.5
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        
        return embedding
    
    @property
    def embedding_dimension(self) -> int:
        """Get embedding dimension."""
        return self.embedding_dim
