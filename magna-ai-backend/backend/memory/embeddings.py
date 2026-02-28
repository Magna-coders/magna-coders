"""
Embedding generation for semantic memory.

Provides abstraction for different embedding models.
"""

from abc import ABC, abstractmethod
from typing import List

# Try to import sentence_transformers, but make it optional
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class EmbeddingModel(ABC):
    """Abstract base class for embedding generation."""
    
    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate vector embedding for text.
        
        Args:
            text: Input text to embed
            
        Returns:
            Vector embedding as list of floats
        """
        pass
    
    @property
    @abstractmethod
    def embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by this model."""
        pass


class SentenceTransformerEmbedding(EmbeddingModel):
    """
    Embedding model using sentence-transformers library.
    
    Uses 'all-MiniLM-L6-v2' model which produces 384-dimensional embeddings.
    This is a lightweight model suitable for semantic similarity tasks.
    
    NOTE: Requires sentence-transformers and PyTorch to be installed.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize sentence transformer model.
        
        Args:
            model_name: Name of the sentence-transformers model to use
            
        Raises:
            ImportError: If sentence-transformers is not installed
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers is not installed. "
                "Install it with: pip install sentence-transformers"
            )
        
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding using sentence-transformers.
        
        Args:
            text: Input text to embed
            
        Returns:
            Vector embedding as list of floats
        """
        # Combine user message and agent response for context
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    @property
    def embedding_dimension(self) -> int:
        """Get embedding dimension (384 for all-MiniLM-L6-v2)."""
        return self.model.get_sentence_embedding_dimension()


class OpenAIEmbedding(EmbeddingModel):
    """
    Embedding model using OpenAI's text-embedding-ada-002.
    
    Produces 1536-dimensional embeddings with high quality.
    Requires OpenAI API key.
    """
    
    def __init__(self, api_key: str, model: str = "text-embedding-ada-002"):
        """
        Initialize OpenAI embedding model.
        
        Args:
            api_key: OpenAI API key
            model: OpenAI embedding model name
        """
        self.api_key = api_key
        self.model = model
        
        # Import here to avoid requiring openai if not used
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding using OpenAI API.
        
        Args:
            text: Input text to embed
            
        Returns:
            Vector embedding as list of floats
        """
        response = await self.client.embeddings.create(
            input=text,
            model=self.model
        )
        return response.data[0].embedding
    
    @property
    def embedding_dimension(self) -> int:
        """Get embedding dimension (1536 for text-embedding-ada-002)."""
        return 1536
