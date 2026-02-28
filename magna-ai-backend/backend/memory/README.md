# Memory System

Hybrid memory system combining episodic (conversation history) and semantic (vector embeddings) storage for the Magna AI Agent.

## Overview

The Memory System provides context-aware retrieval by combining:
- **Episodic Memory**: Stores conversation turns with timestamps
- **Semantic Memory**: Vector embeddings for similarity search

## Components

### 1. MemorySystem (`system.py`)

Main class that orchestrates memory storage and retrieval.

**Key Methods:**
- `store_interaction()`: Save conversation turns with embeddings
- `retrieve_context()`: Hybrid search (recent + semantic)
- `prune_memory()`: Automatic size management
- `sync_to_backend()`: Encrypted backup to backend
- `get_memory_stats()`: Memory usage statistics

**Example Usage:**
```python
from memory import MemorySystem, FileStorageBackend
from memory.embeddings_mock import MockEmbeddingModel

# Initialize
storage = FileStorageBackend(storage_dir="./memory_data")
embedding = MockEmbeddingModel(embedding_dim=384)
memory = MemorySystem(
    storage_backend=storage,
    embedding_model=embedding,
    max_size_mb=5
)

# Store interaction
await memory.store_interaction(
    user_id="user_123",
    conversation_id="conv_456",
    user_message="Find Python jobs in Kenya",
    agent_response="Here are Python jobs in Kenya...",
    metadata={
        "tool_calls": ["search_jobs"],
        "topics": ["jobs", "python", "kenya"]
    }
)

# Retrieve context
context = await memory.retrieve_context(
    user_id="user_123",
    conversation_id="conv_456",
    query="Show me more Python opportunities",
    max_results=5
)
```

### 2. Storage Backends (`storage.py`)

Abstract storage interface with file-based implementation.

**StorageBackend (Abstract):**
- `store()`: Save memory entry
- `retrieve_by_conversation()`: Get conversation history
- `retrieve_by_user()`: Get all user memories
- `search_by_embedding()`: Semantic similarity search
- `delete_oldest()`: Remove old entries
- `get_total_size()`: Calculate storage usage

**FileStorageBackend:**
- Stores memories as JSON files
- Directory structure: `storage_dir/{user_id}/{conversation_id}/{entry_id}.json`
- Implements cosine similarity for semantic search

### 3. Embedding Models (`embeddings.py`)

Generate vector embeddings for semantic search.

**Available Models:**

1. **SentenceTransformerEmbedding** (Production)
   - Uses `all-MiniLM-L6-v2` model
   - 384-dimensional embeddings
   - Requires: `sentence-transformers` and PyTorch
   - Note: PyTorch not yet available for Python 3.13

2. **OpenAIEmbedding** (Production)
   - Uses `text-embedding-ada-002`
   - 1536-dimensional embeddings
   - Requires: OpenAI API key

3. **MockEmbeddingModel** (Testing Only)
   - Deterministic hash-based embeddings
   - Use only for testing when PyTorch unavailable
   - Located in `embeddings_mock.py`

**Example:**
```python
# For production (Python 3.12 or earlier)
from memory.embeddings import SentenceTransformerEmbedding
embedding = SentenceTransformerEmbedding()

# For production with OpenAI
from memory.embeddings import OpenAIEmbedding
embedding = OpenAIEmbedding(api_key="your-api-key")

# For testing only
from memory.embeddings_mock import MockEmbeddingModel
embedding = MockEmbeddingModel(embedding_dim=384)
```

### 4. Data Models (`models/memory.py`)

**MemoryEntry:**
- `id`: Unique identifier
- `user_id`: Owner of the memory
- `conversation_id`: Conversation context
- `timestamp`: When interaction occurred
- `user_message`: User's input
- `agent_response`: Agent's response
- `embedding`: Vector embedding (384 or 1536 dims)
- `importance_score`: For pruning decisions (0.0-1.0)
- `metadata`: Additional context (tools, entities, topics)

**MemoryMetadata:**
- `tool_calls`: Tools used in interaction
- `entities_mentioned`: Named entities
- `topics`: Conversation topics
- `sentiment`: Sentiment score (-1.0 to 1.0)
- `user_satisfaction`: User feedback (0.0 to 1.0)

## Features

### Hybrid Retrieval

Combines two retrieval strategies:
1. **Recent Episodic**: Last 3 turns from current conversation
2. **Semantic Search**: Top 5 similar past interactions

This ensures both immediate context and relevant historical information.

### Automatic Pruning

When storage exceeds `max_size_mb`:
1. Calculates target size (80% of max)
2. Sorts entries by importance and age
3. Removes lowest importance, oldest entries first
4. Preserves semantic embeddings for important interactions

### Importance Scoring

Calculated based on:
- Message length (longer = more important)
- Tool usage (tool calls = more important)
- User satisfaction (if available)
- Entity mentions (more entities = more important)

Score range: 0.0 to 1.0

### Encryption

Memory can be encrypted for backend sync using AES-256:
```python
from cryptography.fernet import Fernet

# Generate key
encryption_key = Fernet.generate_key().decode('utf-8')

# Sync with encryption
result = await memory.sync_to_backend(
    user_id="user_123",
    encryption_key=encryption_key
)

# Load from backend
await memory.load_from_backend(
    user_id="user_123",
    encrypted_data=result["encrypted_data"],
    encryption_key=encryption_key
)
```

## Configuration

From `config.py`:
```python
# Memory Configuration
max_memory_size_mb: int = 5
memory_prune_threshold_mb: float = 4.5
```

## Testing

Run unit tests:
```bash
pytest tests/unit/test_memory_system.py -v
```

Tests cover:
- Storing interactions with embeddings
- Retrieving context with hybrid search
- Memory size limit enforcement
- Automatic pruning
- Encryption and sync
- Memory statistics
- Importance calculation

## Requirements Validated

This implementation validates the following requirements from the spec:

- **6.1**: Store conversation history using file-based storage
- **6.2**: Maintain episodic memory with timestamps
- **6.3**: Generate and store vector embeddings
- **6.4**: Limit storage to 5MB maximum
- **6.5**: Prune oldest entries while preserving semantic embeddings
- **6.6**: Retrieve relevant context for queries
- **6.7**: Encrypt data for backend sync (AES-256)

## Future Enhancements

1. **Database Backend**: PostgreSQL with pgvector extension
2. **Vector Database**: Pinecone or FAISS for faster similarity search
3. **Streaming Embeddings**: Generate embeddings asynchronously
4. **Compression**: Compress old memories to save space
5. **Multi-user Optimization**: Batch operations for multiple users

## Notes

- **Python 3.13 Compatibility**: PyTorch (required by sentence-transformers) is not yet available for Python 3.13. Use MockEmbeddingModel for testing or Python 3.12 for production.
- **Storage Location**: Default is `./memory_storage/` relative to working directory
- **Thread Safety**: Current implementation is not thread-safe. Use with asyncio event loop.
- **Performance**: File-based storage suitable for development. Use database backend for production.
