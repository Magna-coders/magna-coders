"""
LLM Orchestrator for managing multiple providers with automatic fallback.

This module implements the orchestration layer that manages multiple LLM
providers, handles automatic fallback on failures, and provides a unified
interface for LLM generation.
"""

from typing import List, Optional, AsyncIterator, Dict, Any
from dataclasses import dataclass
from enum import Enum
import asyncio
import logging

from .providers import (
    LLMProvider,
    LLMProviderError,
    RateLimitError,
    TimeoutError,
    AuthenticationError,
    ProviderUnavailableError
)

logger = logging.getLogger(__name__)


class ProviderStatus(Enum):
    """Provider health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


@dataclass
class ProviderHealth:
    """Health status for a provider."""
    name: str
    status: ProviderStatus
    last_check: Optional[float] = None
    error_count: int = 0
    last_error: Optional[str] = None


class LLMOrchestrator:
    """Orchestrates multiple LLM providers with automatic fallback."""
    
    def __init__(
        self,
        primary_provider: LLMProvider,
        fallback_providers: Optional[List[LLMProvider]] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """Initialize orchestrator with providers.
        
        Args:
            primary_provider: Primary LLM provider to use first
            fallback_providers: List of fallback providers in order of preference
            max_retries: Maximum retry attempts per provider
            retry_delay: Initial delay between retries (exponential backoff)
        """
        self.primary_provider = primary_provider
        self.fallback_providers = fallback_providers or []
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        # Track provider health
        self._provider_health: Dict[str, ProviderHealth] = {}
        self._last_used_provider: Optional[str] = None
        
        # Initialize health tracking
        self._init_health_tracking()
    
    def _init_health_tracking(self) -> None:
        """Initialize health tracking for all providers."""
        all_providers = [self.primary_provider] + self.fallback_providers
        for provider in all_providers:
            self._provider_health[provider.name] = ProviderHealth(
                name=provider.name,
                status=ProviderStatus.UNKNOWN
            )
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncIterator[str]:
        """Generate response with automatic fallback.
        
        This method tries the primary provider first, then falls back to
        secondary providers if the primary fails. It handles retries with
        exponential backoff for transient errors.
        
        Args:
            prompt: User prompt/query
            system_prompt: Optional system instructions
            stream: Whether to stream the response
            temperature: Override default temperature
            max_tokens: Override default max tokens
            
        Yields:
            Response chunks if streaming, or complete response
            
        Raises:
            LLMProviderError: If all providers fail
        """
        # Build provider chain: primary + fallbacks
        provider_chain = [self.primary_provider] + self.fallback_providers
        
        last_error = None
        
        for provider in provider_chain:
            try:
                logger.info(f"Attempting generation with provider: {provider.name}")
                
                # Try this provider with retries
                async for chunk in self._try_provider_with_retry(
                    provider,
                    prompt,
                    system_prompt,
                    stream
                ):
                    yield chunk
                
                # Success! Update tracking
                self._last_used_provider = provider.name
                self._update_provider_health(provider.name, success=True)
                
                logger.info(f"Successfully generated response with {provider.name}")
                return
                
            except (RateLimitError, TimeoutError, ProviderUnavailableError) as e:
                # These errors warrant trying the next provider
                logger.warning(
                    f"Provider {provider.name} failed with {type(e).__name__}: {e}"
                )
                self._update_provider_health(provider.name, success=False, error=str(e))
                last_error = e
                continue
                
            except AuthenticationError as e:
                # Authentication errors are critical, but try next provider
                logger.error(
                    f"Authentication failed for {provider.name}: {e}"
                )
                self._update_provider_health(provider.name, success=False, error=str(e))
                last_error = e
                continue
                
            except Exception as e:
                # Unexpected error, log and try next provider
                logger.error(
                    f"Unexpected error with {provider.name}: {e}",
                    exc_info=True
                )
                self._update_provider_health(provider.name, success=False, error=str(e))
                last_error = e
                continue
        
        # All providers failed
        error_msg = (
            f"All LLM providers failed. Last error: {last_error}. "
            f"Tried providers: {[p.name for p in provider_chain]}"
        )
        logger.error(error_msg)
        raise LLMProviderError(error_msg)
    
    async def try_provider(
        self,
        provider: LLMProvider,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False,
        timeout_seconds: Optional[int] = None
    ) -> AsyncIterator[str]:
        """Try a single provider with timeout and error handling.
        
        This method attempts to generate a response from a specific provider
        with proper timeout handling and error classification. It does NOT
        perform retries - that's handled by _try_provider_with_retry.
        
        Args:
            provider: LLM provider to use
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream response
            timeout_seconds: Optional timeout override
            
        Yields:
            Response chunks
            
        Raises:
            TimeoutError: If generation exceeds timeout
            RateLimitError: If provider rate limit is hit
            AuthenticationError: If authentication fails
            ProviderUnavailableError: If provider is unavailable
            LLMProviderError: For other provider errors
        """
        # Use provider's configured timeout or override
        timeout = timeout_seconds or provider.config.timeout_seconds
        
        try:
            # Ensure provider is initialized
            await provider.ensure_initialized()
            
            # Try generation with timeout
            # Note: We can't use asyncio.wait_for with async generators directly
            # Instead, we iterate and check timeout manually
            generator = provider.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                stream=stream
            )
            
            start_time = asyncio.get_event_loop().time()
            async for chunk in generator:
                # Check if we've exceeded timeout
                if asyncio.get_event_loop().time() - start_time > timeout:
                    raise asyncio.TimeoutError()
                yield chunk
                
        except asyncio.TimeoutError:
            error_msg = f"Provider {provider.name} timed out after {timeout}s"
            logger.warning(error_msg)
            raise TimeoutError(error_msg)
            
        except RateLimitError:
            logger.warning(f"Rate limit hit for {provider.name}")
            raise
            
        except AuthenticationError:
            logger.error(f"Authentication failed for {provider.name}")
            raise
            
        except ProviderUnavailableError:
            logger.warning(f"Provider {provider.name} is unavailable")
            raise
            
        except Exception as e:
            error_msg = f"Provider {provider.name} failed: {e}"
            logger.error(error_msg)
            raise LLMProviderError(error_msg)
    
    async def _try_provider_with_retry(
        self,
        provider: LLMProvider,
        prompt: str,
        system_prompt: Optional[str],
        stream: bool
    ) -> AsyncIterator[str]:
        """Try a provider with exponential backoff retry.
        
        This method wraps try_provider() with retry logic and exponential backoff
        for transient errors like timeouts.
        
        Args:
            provider: LLM provider to use
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream response
            
        Yields:
            Response chunks
            
        Raises:
            LLMProviderError: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Try this provider
                async for chunk in self.try_provider(
                    provider=provider,
                    prompt=prompt,
                    system_prompt=system_prompt,
                    stream=stream
                ):
                    yield chunk
                
                # Success!
                return
                
            except TimeoutError as e:
                # Timeout - retry with backoff
                last_error = e
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.info(
                        f"Timeout on attempt {attempt + 1}/{self.max_retries}, "
                        f"retrying in {delay}s"
                    )
                    await asyncio.sleep(delay)
                    continue
                else:
                    raise
                    
            except RateLimitError as e:
                # Rate limit - don't retry, move to next provider
                logger.warning(f"Rate limit hit for {provider.name}")
                raise
                
            except (AuthenticationError, ProviderUnavailableError) as e:
                # Don't retry these errors
                raise
                
            except Exception as e:
                # Other errors - retry with backoff
                last_error = e
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.warning(
                        f"Error on attempt {attempt + 1}/{self.max_retries}: {e}, "
                        f"retrying in {delay}s"
                    )
                    await asyncio.sleep(delay)
                    continue
                else:
                    raise
        
        # All retries exhausted
        raise LLMProviderError(
            f"Provider {provider.name} failed after {self.max_retries} attempts: "
            f"{last_error}"
        )
    
    def _update_provider_health(
        self,
        provider_name: str,
        success: bool,
        error: Optional[str] = None
    ) -> None:
        """Update health tracking for a provider.
        
        Args:
            provider_name: Name of the provider
            success: Whether the operation succeeded
            error: Optional error message
        """
        import time
        
        health = self._provider_health.get(provider_name)
        if not health:
            return
        
        health.last_check = time.time()
        
        if success:
            health.status = ProviderStatus.HEALTHY
            health.error_count = 0
            health.last_error = None
        else:
            health.error_count += 1
            health.last_error = error
            
            # Update status based on error count
            if health.error_count >= 3:
                health.status = ProviderStatus.UNAVAILABLE
            else:
                health.status = ProviderStatus.DEGRADED
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get health status of all providers.
        
        Returns:
            Dictionary mapping provider names to their health status
        """
        return {
            name: {
                "status": health.status.value,
                "error_count": health.error_count,
                "last_error": health.last_error,
                "last_check": health.last_check
            }
            for name, health in self._provider_health.items()
        }
    
    @property
    def last_used_provider(self) -> Optional[str]:
        """Get the name of the last successfully used provider."""
        return self._last_used_provider
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Run health checks on all providers.
        
        Returns:
            Dictionary mapping provider names to health status (True/False)
        """
        results = {}
        
        all_providers = [self.primary_provider] + self.fallback_providers
        
        for provider in all_providers:
            try:
                is_healthy = await provider.health_check()
                results[provider.name] = is_healthy
                
                # Update health tracking
                if is_healthy:
                    self._update_provider_health(provider.name, success=True)
                else:
                    self._update_provider_health(
                        provider.name,
                        success=False,
                        error="Health check failed"
                    )
            except Exception as e:
                logger.error(f"Health check failed for {provider.name}: {e}")
                results[provider.name] = False
                self._update_provider_health(
                    provider.name,
                    success=False,
                    error=str(e)
                )
        
        return results
    
    async def close(self) -> None:
        """Close all provider connections."""
        all_providers = [self.primary_provider] + self.fallback_providers
        
        for provider in all_providers:
            try:
                if hasattr(provider, 'close'):
                    await provider.close()
            except Exception as e:
                logger.warning(f"Error closing provider {provider.name}: {e}")
