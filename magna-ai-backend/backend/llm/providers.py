"""
LLM Provider implementations for Magna AI Agent.

This module provides abstract base class and concrete implementations for
multiple LLM providers (Gemini, GPT-4, Ollama) with streaming support.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional, Dict, Any
from dataclasses import dataclass
import asyncio
import logging

# Google Gemini
import google.generativeai as genai

# OpenAI
from openai import AsyncOpenAI

# HTTP client for Ollama
import httpx

logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """Configuration for LLM generation."""
    temperature: float = 0.7
    top_p: float = 0.9
    max_tokens: int = 2048
    timeout_seconds: int = 30


@dataclass
class GenerationResult:
    """Result from LLM generation."""
    content: str
    provider: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(self, config: LLMConfig):
        """Initialize provider with configuration.
        
        Args:
            config: LLM configuration parameters
        """
        self.config = config
        self._initialized = False
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name identifier."""
        pass
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the provider (API clients, connections, etc.)."""
        pass
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> AsyncIterator[str]:
        """Generate response from the LLM.
        
        Args:
            prompt: User prompt/query
            system_prompt: Optional system instructions
            stream: Whether to stream the response
            
        Yields:
            Response chunks if streaming, or complete response
            
        Raises:
            LLMProviderError: If generation fails
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider is available and healthy.
        
        Returns:
            True if provider is operational, False otherwise
        """
        pass
    
    async def ensure_initialized(self) -> None:
        """Ensure provider is initialized before use."""
        if not self._initialized:
            await self.initialize()
            self._initialized = True


class LLMProviderError(Exception):
    """Base exception for LLM provider errors."""
    pass


class ProviderUnavailableError(LLMProviderError):
    """Raised when provider is unavailable."""
    pass


class RateLimitError(LLMProviderError):
    """Raised when rate limit is exceeded."""
    pass


class TimeoutError(LLMProviderError):
    """Raised when request times out."""
    pass


class AuthenticationError(LLMProviderError):
    """Raised when authentication fails."""
    pass


class GeminiProvider(LLMProvider):
    """Google Gemini AI provider implementation."""
    
    def __init__(self, api_key: str, config: LLMConfig, model: str = "gemini-pro"):
        """Initialize Gemini provider.
        
        Args:
            api_key: Google Gemini API key
            config: LLM configuration
            model: Model identifier (default: gemini-pro)
        """
        super().__init__(config)
        self.api_key = api_key
        self.model_name = model
        self._model = None
    
    @property
    def name(self) -> str:
        return "gemini"
    
    async def initialize(self) -> None:
        """Initialize Gemini API client."""
        try:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
            logger.info(f"Initialized Gemini provider with model {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini provider: {e}")
            raise AuthenticationError(f"Gemini initialization failed: {e}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> AsyncIterator[str]:
        """Generate response using Gemini.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream response
            
        Yields:
            Response chunks
        """
        await self.ensure_initialized()
        
        try:
            # Combine system prompt and user prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\nUser: {prompt}"
            
            # Configure generation
            generation_config = genai.types.GenerationConfig(
                temperature=self.config.temperature,
                top_p=self.config.top_p,
                max_output_tokens=self.config.max_tokens,
            )
            
            if stream:
                # Streaming generation
                async for chunk in self._generate_stream(full_prompt, generation_config):
                    yield chunk
            else:
                # Non-streaming generation
                response = await asyncio.wait_for(
                    self._generate_complete(full_prompt, generation_config),
                    timeout=self.config.timeout_seconds
                )
                yield response
                
        except asyncio.TimeoutError:
            logger.error(f"Gemini request timed out after {self.config.timeout_seconds}s")
            raise TimeoutError(f"Request timed out after {self.config.timeout_seconds}s")
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                raise RateLimitError(f"Gemini rate limit exceeded: {e}")
            raise LLMProviderError(f"Gemini generation failed: {e}")
    
    async def _generate_stream(self, prompt: str, config):
        """Generate streaming response."""
        # Run in thread pool since Gemini SDK is synchronous
        loop = asyncio.get_event_loop()
        
        # Get the generator in a thread
        def get_response():
            return self._model.generate_content(
                prompt,
                generation_config=config,
                stream=True
            )
        
        response = await loop.run_in_executor(None, get_response)
        
        # Iterate through chunks in thread pool
        for chunk in response:
            if chunk.text:
                yield chunk.text
    
    async def _generate_complete(self, prompt: str, config) -> str:
        """Generate complete response."""
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self._model.generate_content(
                prompt,
                generation_config=config
            )
        )
        return response.text
    
    async def health_check(self) -> bool:
        """Check Gemini availability."""
        try:
            await self.ensure_initialized()
            # Try a simple generation
            test_prompt = "Hello"
            async for _ in self.generate(test_prompt, stream=False):
                return True
            return True
        except Exception as e:
            logger.warning(f"Gemini health check failed: {e}")
            return False


class GPT4Provider(LLMProvider):
    """OpenAI GPT-4 provider implementation."""
    
    def __init__(self, api_key: str, config: LLMConfig, model: str = "gpt-4"):
        """Initialize GPT-4 provider.
        
        Args:
            api_key: OpenAI API key
            config: LLM configuration
            model: Model identifier (default: gpt-4)
        """
        super().__init__(config)
        self.api_key = api_key
        self.model_name = model
        self._client = None
    
    @property
    def name(self) -> str:
        return "gpt-4"
    
    async def initialize(self) -> None:
        """Initialize OpenAI client."""
        try:
            self._client = AsyncOpenAI(api_key=self.api_key)
            logger.info(f"Initialized GPT-4 provider with model {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize GPT-4 provider: {e}")
            raise AuthenticationError(f"GPT-4 initialization failed: {e}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> AsyncIterator[str]:
        """Generate response using GPT-4.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream response
            
        Yields:
            Response chunks
        """
        await self.ensure_initialized()
        
        try:
            # Build messages
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            # Generate response
            response = await asyncio.wait_for(
                self._client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                    max_tokens=self.config.max_tokens,
                    stream=stream
                ),
                timeout=self.config.timeout_seconds
            )
            
            if stream:
                # Streaming response
                async for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            else:
                # Complete response
                yield response.choices[0].message.content
                
        except asyncio.TimeoutError:
            logger.error(f"GPT-4 request timed out after {self.config.timeout_seconds}s")
            raise TimeoutError(f"Request timed out after {self.config.timeout_seconds}s")
        except Exception as e:
            logger.error(f"GPT-4 generation failed: {e}")
            if "rate_limit" in str(e).lower():
                raise RateLimitError(f"GPT-4 rate limit exceeded: {e}")
            if "authentication" in str(e).lower() or "api_key" in str(e).lower():
                raise AuthenticationError(f"GPT-4 authentication failed: {e}")
            raise LLMProviderError(f"GPT-4 generation failed: {e}")
    
    async def health_check(self) -> bool:
        """Check GPT-4 availability."""
        try:
            await self.ensure_initialized()
            # Try a simple generation
            test_prompt = "Hello"
            async for _ in self.generate(test_prompt, stream=False):
                return True
            return True
        except Exception as e:
            logger.warning(f"GPT-4 health check failed: {e}")
            return False


class OllamaProvider(LLMProvider):
    """Ollama local model provider implementation."""
    
    def __init__(
        self,
        config: LLMConfig,
        base_url: str = "http://localhost:11434",
        model: str = "llama3"
    ):
        """Initialize Ollama provider.
        
        Args:
            config: LLM configuration
            base_url: Ollama server URL
            model: Model identifier (default: llama3)
        """
        super().__init__(config)
        self.base_url = base_url.rstrip('/')
        self.model_name = model
        self._client = None
    
    @property
    def name(self) -> str:
        return "ollama"
    
    async def initialize(self) -> None:
        """Initialize Ollama HTTP client."""
        try:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.config.timeout_seconds
            )
            # Check if Ollama is running
            response = await self._client.get("/api/tags")
            if response.status_code != 200:
                raise ProviderUnavailableError("Ollama server not responding")
            logger.info(f"Initialized Ollama provider with model {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Ollama provider: {e}")
            raise ProviderUnavailableError(f"Ollama initialization failed: {e}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> AsyncIterator[str]:
        """Generate response using Ollama.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream response
            
        Yields:
            Response chunks
        """
        await self.ensure_initialized()
        
        try:
            # Build request payload
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": self.config.temperature,
                    "top_p": self.config.top_p,
                    "num_predict": self.config.max_tokens,
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            # Make request
            if stream:
                # Streaming response
                async with self._client.stream(
                    "POST",
                    "/api/generate",
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        raise LLMProviderError(
                            f"Ollama request failed: {response.status_code}"
                        )
                    
                    async for line in response.aiter_lines():
                        if line:
                            import json
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
            else:
                # Complete response
                response = await self._client.post(
                    "/api/generate",
                    json=payload
                )
                
                if response.status_code != 200:
                    raise LLMProviderError(
                        f"Ollama request failed: {response.status_code}"
                    )
                
                result = response.json()
                yield result.get("response", "")
                
        except asyncio.TimeoutError:
            logger.error(f"Ollama request timed out after {self.config.timeout_seconds}s")
            raise TimeoutError(f"Request timed out after {self.config.timeout_seconds}s")
        except httpx.ConnectError as e:
            logger.error(f"Cannot connect to Ollama server: {e}")
            raise ProviderUnavailableError(f"Ollama server unavailable: {e}")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise LLMProviderError(f"Ollama generation failed: {e}")
    
    async def health_check(self) -> bool:
        """Check Ollama availability."""
        try:
            await self.ensure_initialized()
            response = await self._client.get("/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False
    
    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()



class NVIDIANIMProvider(LLMProvider):
    """NVIDIA NIM (NVIDIA Inference Microservices) provider implementation.
    
    Supports NVIDIA's hosted LLM models through their API.
    Uses OpenAI-compatible API format.
    
    Supports reasoning models like DeepSeek V3.2 with thinking process.
    """
    
    def __init__(
        self,
        config: LLMConfig,
        api_key: str,
        model: str = "meta/llama-3.1-70b-instruct"
    ):
        """Initialize NVIDIA NIM provider.
        
        Args:
            config: LLM configuration
            api_key: NVIDIA NIM API key
            model: Model identifier (default: meta/llama-3.1-70b-instruct)
                   Available models:
                   - deepseek-ai/deepseek-v3.2 (reasoning model with thinking)
                   - meta/llama-3.1-70b-instruct (recommended for general use)
                   - meta/llama-3.1-8b-instruct (faster)
                   - mistralai/mixtral-8x7b-instruct-v0.1
                   - google/gemma-2-9b-it
        """
        super().__init__(config)
        self.api_key = api_key
        self.model_name = model
        self._client = None
        self.is_reasoning_model = "deepseek" in model.lower()
    
    @property
    def name(self) -> str:
        return f"nvidia_nim_{self.model_name.split('/')[-1]}"
    
    async def initialize(self) -> None:
        """Initialize NVIDIA NIM client."""
        try:
            # Use OpenAI client with NVIDIA base URL
            self._client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://integrate.api.nvidia.com/v1"
            )
            logger.info(f"Initialized NVIDIA NIM provider with model {self.model_name}")
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize NVIDIA NIM provider: {e}")
            raise ProviderUnavailableError(f"NVIDIA NIM initialization failed: {e}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> AsyncIterator[str]:
        """Generate response using NVIDIA NIM.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream response
            
        Yields:
            Response chunks (includes reasoning for DeepSeek models)
        """
        await self.ensure_initialized()
        
        try:
            # Build messages
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            logger.debug(f"Attempting generation with provider: {self.name}")
            
            # Extra parameters for reasoning models
            extra_body = {}
            if self.is_reasoning_model:
                extra_body = {"chat_template_kwargs": {"thinking": True}}
            
            if stream:
                # Streaming response
                response_stream = await self._client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                    max_tokens=self.config.max_tokens,
                    stream=True,
                    extra_body=extra_body if extra_body else None
                )
                
                async for chunk in response_stream:
                    if not hasattr(chunk, "choices") or not chunk.choices:
                        continue
                    
                    # Handle reasoning content (for DeepSeek)
                    reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
                    if reasoning:
                        # Skip reasoning in output (internal thinking process)
                        continue
                    
                    # Regular content
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            else:
                # Complete response
                response = await self._client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                    max_tokens=self.config.max_tokens,
                    stream=False,
                    extra_body=extra_body if extra_body else None
                )
                
                if response.choices:
                    yield response.choices[0].message.content or ""
            
            logger.info(f"Successfully generated response with {self.name}")
            
        except asyncio.TimeoutError:
            logger.error(f"NVIDIA NIM request timed out after {self.config.timeout_seconds}s")
            raise TimeoutError(f"Request timed out after {self.config.timeout_seconds}s")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"NVIDIA NIM generation failed: {error_msg}")
            
            # Check for rate limiting
            if "rate limit" in error_msg.lower() or "429" in error_msg:
                raise RateLimitError(f"NVIDIA NIM rate limit exceeded: {error_msg}")
            
            raise LLMProviderError(f"NVIDIA NIM generation failed: {error_msg}")
    
    async def health_check(self) -> bool:
        """Check NVIDIA NIM availability."""
        try:
            await self.ensure_initialized()
            # Try a simple generation
            test_prompt = "Hello"
            async for _ in self.generate(test_prompt, stream=False):
                return True
            return True
        except Exception as e:
            logger.warning(f"NVIDIA NIM health check failed: {e}")
            return False
