"""
LLM Orchestration Module

Manages multiple LLM providers with automatic fallback and load balancing.
"""

from .orchestrator import LLMOrchestrator, ProviderStatus, ProviderHealth
from .providers import (
    LLMProvider,
    LLMConfig,
    GenerationResult,
    GeminiProvider,
    GPT4Provider,
    OllamaProvider,
    LLMProviderError,
    ProviderUnavailableError,
    RateLimitError,
    TimeoutError,
    AuthenticationError
)
from .factory import (
    create_llm_config,
    create_gemini_provider,
    create_gpt4_provider,
    create_ollama_provider,
    create_llm_orchestrator,
    create_orchestrator_with_custom_providers
)

__all__ = [
    # Orchestrator
    "LLMOrchestrator",
    "ProviderStatus",
    "ProviderHealth",
    # Providers
    "LLMProvider",
    "LLMConfig",
    "GenerationResult",
    "GeminiProvider",
    "GPT4Provider",
    "OllamaProvider",
    # Exceptions
    "LLMProviderError",
    "ProviderUnavailableError",
    "RateLimitError",
    "TimeoutError",
    "AuthenticationError",
    # Factory functions
    "create_llm_config",
    "create_gemini_provider",
    "create_gpt4_provider",
    "create_ollama_provider",
    "create_llm_orchestrator",
    "create_orchestrator_with_custom_providers"
]
