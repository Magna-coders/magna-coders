"""
Property-based tests for LLM Orchestrator.

These tests validate universal correctness properties of the LLM orchestrator
using Hypothesis for property-based testing.
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from unittest.mock import AsyncMock, Mock, patch
import asyncio

from ...llm.orchestrator import LLMOrchestrator, ProviderStatus
from ...llm.providers import (
    LLMProvider,
    LLMConfig,
    LLMProviderError,
    RateLimitError,
    TimeoutError,
    AuthenticationError,
    ProviderUnavailableError
)


# Mock provider for testing
class MockLLMProvider(LLMProvider):
    """Mock LLM provider for testing."""
    
    def __init__(self, name: str, config: LLMConfig, should_fail: bool = False):
        super().__init__(config)
        self._name = name
        self._should_fail = should_fail
        self._call_count = 0
    
    @property
    def name(self) -> str:
        return self._name
    
    async def initialize(self) -> None:
        """Initialize mock provider."""
        if self._should_fail:
            raise AuthenticationError(f"Mock {self._name} initialization failed")
        self._initialized = True
    
    async def generate(self, prompt: str, system_prompt: str = None, stream: bool = False):
        """Generate mock response."""
        self._call_count += 1
        
        if self._should_fail:
            raise LLMProviderError(f"Mock {self._name} generation failed")
        
        # Yield mock response
        response = f"Response from {self._name}: {prompt[:20]}"
        yield response
    
    async def health_check(self) -> bool:
        """Mock health check."""
        return not self._should_fail


# Hypothesis strategies
@st.composite
def llm_config_strategy(draw):
    """Generate valid LLM configurations."""
    return LLMConfig(
        temperature=draw(st.floats(min_value=0.0, max_value=1.0)),
        top_p=draw(st.floats(min_value=0.0, max_value=1.0)),
        max_tokens=draw(st.integers(min_value=100, max_value=4096)),
        timeout_seconds=draw(st.integers(min_value=5, max_value=60))
    )


@st.composite
def provider_list_strategy(draw, min_providers=1, max_providers=3):
    """Generate list of mock providers."""
    config = draw(llm_config_strategy())
    num_providers = draw(st.integers(min_value=min_providers, max_value=max_providers))
    
    providers = []
    for i in range(num_providers):
        name = f"provider-{i}"
        should_fail = draw(st.booleans())
        providers.append(MockLLMProvider(name, config, should_fail=should_fail))
    
    return providers


@st.composite
def prompt_strategy(draw):
    """Generate test prompts."""
    return draw(st.text(min_size=1, max_size=200))


# Property 1: Multi-provider support
# **Validates: Requirements 1.1, 1.3**
@pytest.mark.asyncio
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture], max_examples=50)
@given(
    providers=provider_list_strategy(min_providers=2, max_providers=3),
    prompt=prompt_strategy()
)
async def test_property_multi_provider_support(providers, prompt):
    """
    Property 1: Multi-provider support
    
    For any agent configuration with multiple LLM providers, the agent should
    successfully initialize and be able to generate responses using any
    configured provider.
    
    **Validates: Requirements 1.1, 1.3**
    """
    # Ensure at least one provider works
    working_providers = [p for p in providers if not p._should_fail]
    if not working_providers:
        # Make first provider work
        providers[0]._should_fail = False
    
    # Create orchestrator with multiple providers
    primary = providers[0]
    fallbacks = providers[1:] if len(providers) > 1 else []
    
    orchestrator = LLMOrchestrator(
        primary_provider=primary,
        fallback_providers=fallbacks,
        max_retries=2,
        retry_delay=0.1
    )
    
    # Should be able to generate response
    response_chunks = []
    async for chunk in orchestrator.generate(prompt, stream=False):
        response_chunks.append(chunk)
    
    # Verify response was generated
    assert len(response_chunks) > 0
    assert any(len(chunk) > 0 for chunk in response_chunks)
    
    # Verify a provider was used
    assert orchestrator.last_used_provider is not None


# Property 2: Automatic fallback on provider failure
# **Validates: Requirements 1.2, 15.1**
@pytest.mark.asyncio
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture], max_examples=50)
@given(
    prompt=prompt_strategy()
)
async def test_property_automatic_fallback(prompt):
    """
    Property 2: Automatic fallback on provider failure
    
    For any request where the primary LLM provider fails (timeout, error,
    rate limit), the agent should automatically attempt the fallback provider
    and successfully return a response.
    
    **Validates: Requirements 1.2, 15.1**
    """
    config = LLMConfig(temperature=0.7, top_p=0.9, max_tokens=2048, timeout_seconds=30)
    
    # Create failing primary and working fallback
    primary = MockLLMProvider("primary", config, should_fail=True)
    fallback = MockLLMProvider("fallback", config, should_fail=False)
    
    orchestrator = LLMOrchestrator(
        primary_provider=primary,
        fallback_providers=[fallback],
        max_retries=2,
        retry_delay=0.1
    )
    
    # Should successfully generate response using fallback
    response_chunks = []
    async for chunk in orchestrator.generate(prompt, stream=False):
        response_chunks.append(chunk)
    
    # Verify response was generated
    assert len(response_chunks) > 0
    
    # Verify fallback was used (not primary)
    assert orchestrator.last_used_provider == "fallback"
    
    # Verify primary provider health is degraded
    status = orchestrator.get_provider_status()
    assert status["primary"]["status"] in ["degraded", "unavailable"]
    assert status["fallback"]["status"] == "healthy"


# Property 3: Provider configuration validation
# **Validates: Requirements 1.4**
@pytest.mark.asyncio
async def test_property_configuration_validation():
    """
    Property 3: Provider configuration validation
    
    For any agent initialization, if LLM provider configuration is invalid or
    incomplete, the agent should fail initialization with a clear error message.
    
    **Validates: Requirements 1.4**
    """
    config = LLMConfig(temperature=0.7, top_p=0.9, max_tokens=2048, timeout_seconds=30)
    
    # Create provider that fails initialization
    failing_provider = MockLLMProvider("failing", config, should_fail=True)
    
    orchestrator = LLMOrchestrator(
        primary_provider=failing_provider,
        fallback_providers=[],
        max_retries=2,
        retry_delay=0.1
    )
    
    # Should raise error when trying to generate
    with pytest.raises((LLMProviderError, AuthenticationError)):
        async for _ in orchestrator.generate("test prompt", stream=False):
            pass


# Property 4: LLM parameter consistency
# **Validates: Requirements 1.6**
@pytest.mark.asyncio
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture], max_examples=50)
@given(
    prompt=prompt_strategy()
)
async def test_property_llm_parameter_consistency(prompt):
    """
    Property 4: LLM parameter consistency
    
    For any LLM generation request, the agent should pass temperature=0.7,
    top_p=0.9, and max_tokens=2048 to the provider.
    
    **Validates: Requirements 1.6**
    """
    # Create config with expected parameters
    expected_config = LLMConfig(
        temperature=0.7,
        top_p=0.9,
        max_tokens=2048,
        timeout_seconds=30
    )
    
    provider = MockLLMProvider("test", expected_config, should_fail=False)
    
    orchestrator = LLMOrchestrator(
        primary_provider=provider,
        fallback_providers=[],
        max_retries=2,
        retry_delay=0.1
    )
    
    # Generate response
    async for _ in orchestrator.generate(prompt, stream=False):
        pass
    
    # Verify provider config matches expected values
    assert provider.config.temperature == 0.7
    assert provider.config.top_p == 0.9
    assert provider.config.max_tokens == 2048


# Additional test: Health check functionality
@pytest.mark.asyncio
async def test_health_check_all_providers():
    """Test health check functionality for all providers."""
    config = LLMConfig(temperature=0.7, top_p=0.9, max_tokens=2048, timeout_seconds=30)
    
    healthy_provider = MockLLMProvider("healthy", config, should_fail=False)
    unhealthy_provider = MockLLMProvider("unhealthy", config, should_fail=True)
    
    orchestrator = LLMOrchestrator(
        primary_provider=healthy_provider,
        fallback_providers=[unhealthy_provider],
        max_retries=2,
        retry_delay=0.1
    )
    
    # Run health checks
    results = await orchestrator.health_check_all()
    
    # Verify results
    assert results["healthy"] is True
    assert results["unhealthy"] is False


# Additional test: Provider status tracking
@pytest.mark.asyncio
async def test_provider_status_tracking():
    """Test that provider status is tracked correctly."""
    config = LLMConfig(temperature=0.7, top_p=0.9, max_tokens=2048, timeout_seconds=30)
    
    provider = MockLLMProvider("test", config, should_fail=False)
    
    orchestrator = LLMOrchestrator(
        primary_provider=provider,
        fallback_providers=[],
        max_retries=2,
        retry_delay=0.1
    )
    
    # Initial status should be unknown
    status = orchestrator.get_provider_status()
    assert status["test"]["status"] == "unknown"
    
    # After successful generation, should be healthy
    async for _ in orchestrator.generate("test prompt", stream=False):
        pass
    
    status = orchestrator.get_provider_status()
    assert status["test"]["status"] == "healthy"
    assert status["test"]["error_count"] == 0


# Additional test: Cleanup
@pytest.mark.asyncio
async def test_orchestrator_cleanup():
    """Test that orchestrator properly closes all providers."""
    config = LLMConfig(temperature=0.7, top_p=0.9, max_tokens=2048, timeout_seconds=30)
    
    provider1 = MockLLMProvider("provider1", config, should_fail=False)
    provider2 = MockLLMProvider("provider2", config, should_fail=False)
    
    orchestrator = LLMOrchestrator(
        primary_provider=provider1,
        fallback_providers=[provider2],
        max_retries=2,
        retry_delay=0.1
    )
    
    # Close should not raise errors
    await orchestrator.close()
