# LLM Orchestration Module

This module provides a robust LLM orchestration layer for the Magna AI Agent, supporting multiple providers with automatic fallback and retry logic.

## Features

- **Multi-Provider Support**: Gemini, GPT-4, and Ollama (local models)
- **Automatic Fallback**: Seamlessly switches to backup providers on failure
- **Streaming Support**: Both streaming and non-streaming response generation
- **Health Monitoring**: Track provider availability and error rates
- **Retry Logic**: Exponential backoff for transient errors
- **Type Safety**: Full type hints for better IDE support

## Architecture

### Components

1. **LLMProvider (Abstract Base Class)**: Defines the interface all providers must implement
2. **Concrete Providers**: GeminiProvider, GPT4Provider, OllamaProvider
3. **LLMOrchestrator**: Manages providers and handles fallback logic
4. **Factory Functions**: Convenient creation from configuration

### Provider Hierarchy

```
Primary: Gemini (Google Generative AI)
    ↓ (on failure)
Fallback 1: GPT-4 (OpenAI)
    ↓ (on failure)
Fallback 2: Ollama (Local models - Llama 3, Mistral)
```

## Usage

### Basic Usage with Factory

```python
from magna_ai.backend.llm import create_llm_orchestrator
from magna_ai.backend.config import settings

# Create orchestrator from settings
orchestrator = create_llm_orchestrator(settings)

# Generate response with automatic fallback
async for chunk in orchestrator.generate(
    prompt="What are the key skills for a Python developer?",
    system_prompt="You are a helpful career advisor.",
    stream=True
):
    print(chunk, end="", flush=True)

# Check which provider was used
print(f"\nUsed provider: {orchestrator.last_used_provider}")
```

### Manual Provider Configuration

```python
from magna_ai.backend.llm import (
    GeminiProvider,
    GPT4Provider,
    LLMConfig,
    LLMOrchestrator
)

# Configure LLM parameters
config = LLMConfig(
    temperature=0.7,
    top_p=0.9,
    max_tokens=2048,
    timeout_seconds=30
)

# Create providers
gemini = GeminiProvider(api_key="your-key", config=config)
gpt4 = GPT4Provider(api_key="your-key", config=config)

# Create orchestrator
orchestrator = LLMOrchestrator(
    primary_provider=gemini,
    fallback_providers=[gpt4],
    max_retries=3,
    retry_delay=1.0
)

# Use it
async for chunk in orchestrator.generate("Hello!", stream=True):
    print(chunk, end="")
```

### Non-Streaming Response

```python
# Get complete response at once
async for response in orchestrator.generate(
    prompt="Explain TypeScript benefits",
    stream=False
):
    print(response)  # Complete response in one chunk
```

### Health Checks

```python
# Check all providers
health_results = await orchestrator.health_check_all()
for provider, is_healthy in health_results.items():
    print(f"{provider}: {'✓' if is_healthy else '✗'}")

# Get detailed status
status = orchestrator.get_provider_status()
for provider, details in status.items():
    print(f"{provider}: {details['status']}")
    if details['last_error']:
        print(f"  Last error: {details['last_error']}")
```

## Configuration

### Environment Variables

Required in `.env` file:

```bash
# Primary provider (required)
GEMINI_API_KEY=your-gemini-api-key

# Fallback providers (optional)
OPENAI_API_KEY=your-openai-api-key
OLLAMA_BASE_URL=http://localhost:11434

# LLM parameters
LLM_TEMPERATURE=0.7
LLM_TOP_P=0.9
LLM_MAX_TOKENS=2048
LLM_TIMEOUT_SECONDS=30

# Feature flags
ENABLE_LOCAL_MODELS=false
```

### LLM Configuration

```python
@dataclass
class LLMConfig:
    temperature: float = 0.7      # Creativity (0.0-1.0)
    top_p: float = 0.9            # Nucleus sampling
    max_tokens: int = 2048        # Maximum response length
    timeout_seconds: int = 30     # Request timeout
```

## Error Handling

The orchestrator handles various error types:

### Automatic Fallback Errors
- `RateLimitError`: Rate limit exceeded → try next provider
- `TimeoutError`: Request timeout → retry with backoff, then fallback
- `ProviderUnavailableError`: Service down → try next provider

### Critical Errors
- `AuthenticationError`: Invalid API key → try next provider
- `LLMProviderError`: Generic error → retry, then fallback

### Example

```python
try:
    async for chunk in orchestrator.generate(prompt):
        print(chunk, end="")
except LLMProviderError as e:
    print(f"All providers failed: {e}")
```

## Provider Details

### GeminiProvider

- **Model**: `gemini-pro`
- **SDK**: `google-generativeai`
- **Streaming**: ✓ Supported
- **Local**: ✗ Cloud-based

### GPT4Provider

- **Model**: `gpt-4`
- **SDK**: `openai`
- **Streaming**: ✓ Supported
- **Local**: ✗ Cloud-based

### OllamaProvider

- **Models**: `llama3`, `mistral`, etc.
- **Protocol**: HTTP REST API
- **Streaming**: ✓ Supported
- **Local**: ✓ Runs locally

## Retry Strategy

The orchestrator implements exponential backoff:

1. **First attempt**: Immediate
2. **Second attempt**: Wait 1 second
3. **Third attempt**: Wait 2 seconds
4. **Failure**: Move to next provider

## Health Monitoring

Provider health is tracked automatically:

- **HEALTHY**: Recent successful requests
- **DEGRADED**: 1-2 recent failures
- **UNAVAILABLE**: 3+ consecutive failures
- **UNKNOWN**: Not yet tested

## Testing

See `example_usage.py` for complete examples.

```python
# Run examples
python -m magna_ai.backend.llm.example_usage
```

## Requirements

Install dependencies:

```bash
pip install google-generativeai openai httpx
```

Or use the project requirements:

```bash
pip install -r requirements.txt
```

## Best Practices

1. **Always use the orchestrator** instead of providers directly for production
2. **Configure at least 2 providers** for reliability
3. **Use streaming** for better user experience with long responses
4. **Monitor health status** to detect provider issues early
5. **Set appropriate timeouts** based on your use case
6. **Handle errors gracefully** and inform users when all providers fail

## Architecture Decisions

### Why Multiple Providers?

- **Reliability**: If one service is down, others can take over
- **Rate Limits**: Distribute load across providers
- **Cost Optimization**: Use cheaper providers when available
- **Flexibility**: Easy to add/remove providers

### Why Streaming?

- **Better UX**: Users see responses as they're generated
- **Lower Latency**: First tokens arrive quickly
- **Cancellation**: Can stop generation early if needed

### Why Async?

- **Non-blocking**: Handle multiple requests concurrently
- **Scalability**: Better resource utilization
- **Modern**: Aligns with FastAPI and modern Python practices

## Future Enhancements

- [ ] Load balancing across providers
- [ ] Response caching
- [ ] Token usage tracking and limits
- [ ] Custom model selection per request
- [ ] Provider-specific optimizations
- [ ] Metrics and monitoring integration

## Related Modules

- `agent/`: Uses LLM orchestrator for reasoning
- `memory/`: Stores conversation context
- `tools/`: Provides external capabilities
- `config.py`: Configuration management

## Support

For issues or questions, see the main Magna AI Agent documentation.
