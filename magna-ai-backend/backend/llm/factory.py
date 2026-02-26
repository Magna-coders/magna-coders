"""
Factory functions for creating LLM providers and orchestrator.

This module provides convenient factory functions to create LLM providers
and orchestrator from configuration settings.
"""

from typing import List, Optional
import logging

from .providers import (
    LLMProvider,
    LLMConfig,
    GeminiProvider,
    GPT4Provider,
    OllamaProvider,
    NVIDIANIMProvider
)
from .orchestrator import LLMOrchestrator
from ..config import Settings

logger = logging.getLogger(__name__)


def create_llm_config(settings: Settings) -> LLMConfig:
    """Create LLM configuration from settings.
    
    Args:
        settings: Application settings
        
    Returns:
        LLM configuration object
    """
    return LLMConfig(
        temperature=settings.llm_temperature,
        top_p=settings.llm_top_p,
        max_tokens=settings.llm_max_tokens,
        timeout_seconds=settings.llm_timeout_seconds
    )


def create_gemini_provider(settings: Settings) -> Optional[GeminiProvider]:
    """Create Gemini provider if API key is available.
    
    Args:
        settings: Application settings
        
    Returns:
        GeminiProvider instance or None if API key not configured
    """
    if not settings.gemini_api_key:
        logger.warning("Gemini API key not configured")
        return None
    
    config = create_llm_config(settings)
    return GeminiProvider(
        api_key=settings.gemini_api_key,
        config=config,
        model="gemini-2.5-flash"  # Updated to use available model
    )


def create_gpt4_provider(settings: Settings) -> Optional[GPT4Provider]:
    """Create GPT-4 provider if API key is available.
    
    Args:
        settings: Application settings
        
    Returns:
        GPT4Provider instance or None if API key not configured
    """
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not configured")
        return None
    
    config = create_llm_config(settings)
    return GPT4Provider(
        api_key=settings.openai_api_key,
        config=config,
        model="gpt-4"
    )


def create_nvidia_nim_provider(settings: Settings) -> Optional[NVIDIANIMProvider]:
    """Create NVIDIA NIM provider if API key is available.
    
    Args:
        settings: Application settings
        
    Returns:
        NVIDIANIMProvider instance or None if API key not configured
    """
    if not hasattr(settings, 'nvidia_nim_api_key') or not settings.nvidia_nim_api_key:
        logger.warning("NVIDIA NIM API key not configured")
        return None
    
    config = create_llm_config(settings)
    
    # Choose model based on settings (default to DeepSeek V3.2 for reasoning)
    model = getattr(settings, 'nvidia_nim_model', 'deepseek-ai/deepseek-v3.2')
    
    return NVIDIANIMProvider(
        api_key=settings.nvidia_nim_api_key,
        config=config,
        model=model
    )


def create_ollama_provider(settings: Settings) -> Optional[OllamaProvider]:
    """Create Ollama provider if local models are enabled.
    
    Args:
        settings: Application settings
        
    Returns:
        OllamaProvider instance or None if local models disabled
    """
    if not settings.enable_local_models:
        logger.info("Local models disabled, skipping Ollama provider")
        return None
    
    config = create_llm_config(settings)
    return OllamaProvider(
        config=config,
        base_url=settings.ollama_base_url,
        model="llama3"
    )


def create_llm_orchestrator(settings: Settings) -> LLMOrchestrator:
    """Create LLM orchestrator with configured providers.
    
    This factory function creates an orchestrator with:
    - Primary: NVIDIA NIM (if API key available) - FASTEST & NO RATE LIMITS
    - Fallback 1: Gemini (if API key available)
    - Fallback 2: GPT-4 (if API key available)
    - Fallback 3: Ollama (if local models enabled)
    
    Args:
        settings: Application settings
        
    Returns:
        Configured LLMOrchestrator instance
        
    Raises:
        ValueError: If no providers are configured
    """
    # Create all available providers (NVIDIA NIM first for best performance)
    nvidia_nim = create_nvidia_nim_provider(settings)
    gemini = create_gemini_provider(settings)
    gpt4 = create_gpt4_provider(settings)
    ollama = create_ollama_provider(settings)
    
    # Build provider list (NVIDIA NIM prioritized)
    providers = [p for p in [nvidia_nim, gemini, gpt4, ollama] if p is not None]
    
    if not providers:
        raise ValueError(
            "No LLM providers configured. Please set at least one API key "
            "(NVIDIA_NIM_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY) or enable local models."
        )
    
    # First provider is primary, rest are fallbacks
    primary = providers[0]
    fallbacks = providers[1:] if len(providers) > 1 else []
    
    logger.info(
        f"Creating LLM orchestrator with primary: {primary.name}, "
        f"fallbacks: {[p.name for p in fallbacks]}"
    )
    
    return LLMOrchestrator(
        primary_provider=primary,
        fallback_providers=fallbacks,
        max_retries=3,
        retry_delay=1.0
    )


def create_orchestrator_with_custom_providers(
    primary: LLMProvider,
    fallbacks: Optional[List[LLMProvider]] = None,
    max_retries: int = 3,
    retry_delay: float = 1.0
) -> LLMOrchestrator:
    """Create orchestrator with custom provider configuration.
    
    This is useful for testing or when you need fine-grained control
    over provider selection and ordering.
    
    Args:
        primary: Primary LLM provider
        fallbacks: Optional list of fallback providers
        max_retries: Maximum retry attempts per provider
        retry_delay: Initial delay between retries
        
    Returns:
        Configured LLMOrchestrator instance
    """
    return LLMOrchestrator(
        primary_provider=primary,
        fallback_providers=fallbacks or [],
        max_retries=max_retries,
        retry_delay=retry_delay
    )
