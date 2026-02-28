"""
Example usage of LLM providers and orchestrator.

This file demonstrates how to use the LLM providers and orchestrator
for the Magna AI Agent.
"""

import asyncio
from .providers import GeminiProvider, GPT4Provider, OllamaProvider, LLMConfig
from .orchestrator import LLMOrchestrator


async def example_single_provider():
    """Example: Using a single provider directly."""
    print("=== Example: Single Provider ===\n")
    
    # Configure LLM parameters
    config = LLMConfig(
        temperature=0.7,
        top_p=0.9,
        max_tokens=2048,
        timeout_seconds=30
    )
    
    # Initialize Gemini provider
    gemini = GeminiProvider(
        api_key="your-gemini-api-key",
        config=config,
        model="gemini-pro"
    )
    
    # Generate response
    prompt = "What are the key skills for a Python developer?"
    system_prompt = "You are a helpful career advisor for developers."
    
    print(f"Prompt: {prompt}\n")
    print("Response: ", end="")
    
    async for chunk in gemini.generate(prompt, system_prompt, stream=True):
        print(chunk, end="", flush=True)
    
    print("\n")


async def example_orchestrator_with_fallback():
    """Example: Using orchestrator with automatic fallback."""
    print("=== Example: Orchestrator with Fallback ===\n")
    
    # Configure LLM parameters
    config = LLMConfig(
        temperature=0.7,
        top_p=0.9,
        max_tokens=2048,
        timeout_seconds=30
    )
    
    # Initialize providers
    gemini = GeminiProvider(
        api_key="your-gemini-api-key",
        config=config
    )
    
    gpt4 = GPT4Provider(
        api_key="your-openai-api-key",
        config=config,
        model="gpt-4"
    )
    
    ollama = OllamaProvider(
        config=config,
        base_url="http://localhost:11434",
        model="llama3"
    )
    
    # Create orchestrator with fallback chain
    orchestrator = LLMOrchestrator(
        primary_provider=gemini,
        fallback_providers=[gpt4, ollama],
        max_retries=3,
        retry_delay=1.0
    )
    
    # Generate response (will automatically fallback if primary fails)
    prompt = "Explain the benefits of TypeScript over JavaScript."
    system_prompt = "You are a technical expert explaining programming concepts."
    
    print(f"Prompt: {prompt}\n")
    print("Response: ", end="")
    
    try:
        async for chunk in orchestrator.generate(
            prompt,
            system_prompt,
            stream=True
        ):
            print(chunk, end="", flush=True)
        
        print(f"\n\nUsed provider: {orchestrator.last_used_provider}")
    except Exception as e:
        print(f"\nError: {e}")
    
    print("\n")


async def example_health_checks():
    """Example: Checking provider health status."""
    print("=== Example: Health Checks ===\n")
    
    config = LLMConfig()
    
    # Initialize providers
    gemini = GeminiProvider("your-gemini-api-key", config)
    gpt4 = GPT4Provider("your-openai-api-key", config)
    ollama = OllamaProvider(config)
    
    # Create orchestrator
    orchestrator = LLMOrchestrator(
        primary_provider=gemini,
        fallback_providers=[gpt4, ollama]
    )
    
    # Run health checks
    print("Running health checks on all providers...\n")
    health_results = await orchestrator.health_check_all()
    
    for provider_name, is_healthy in health_results.items():
        status = "✓ Healthy" if is_healthy else "✗ Unavailable"
        print(f"{provider_name}: {status}")
    
    print("\nDetailed status:")
    status = orchestrator.get_provider_status()
    for provider_name, details in status.items():
        print(f"\n{provider_name}:")
        print(f"  Status: {details['status']}")
        print(f"  Error count: {details['error_count']}")
        if details['last_error']:
            print(f"  Last error: {details['last_error']}")
    
    print("\n")


async def example_non_streaming():
    """Example: Non-streaming response."""
    print("=== Example: Non-Streaming Response ===\n")
    
    config = LLMConfig()
    gemini = GeminiProvider("your-gemini-api-key", config)
    
    prompt = "List 3 benefits of using FastAPI."
    
    print(f"Prompt: {prompt}\n")
    print("Response:")
    
    # Non-streaming: get complete response at once
    async for response in gemini.generate(prompt, stream=False):
        print(response)
    
    print("\n")


async def main():
    """Run all examples."""
    print("=" * 60)
    print("LLM Provider Examples for Magna AI Agent")
    print("=" * 60)
    print()
    
    # Note: Replace API keys with actual keys to run these examples
    
    # Uncomment to run examples:
    # await example_single_provider()
    # await example_orchestrator_with_fallback()
    # await example_health_checks()
    # await example_non_streaming()
    
    print("Examples completed!")
    print("\nNote: Replace API keys in the code to run actual examples.")


if __name__ == "__main__":
    asyncio.run(main())
