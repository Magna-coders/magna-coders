"""
Circuit breaker pattern for backend communication resilience.

This module implements a circuit breaker that prevents cascading failures
by temporarily blocking requests to a failing service.
"""

import asyncio
import time
from typing import Callable, Any, Optional, Dict
from enum import Enum
from datetime import datetime, timedelta

from .logging import get_logger
from .exceptions import NetworkError

logger = get_logger(__name__)


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation, requests pass through
    OPEN = "open"          # Circuit is open, requests fail immediately
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerError(NetworkError):
    """Raised when circuit breaker is open."""
    
    def __init__(self, message: str = "Circuit breaker is open", context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)


class CircuitBreaker:
    """
    Circuit breaker for protecting against cascading failures.
    
    The circuit breaker has three states:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Too many failures, requests fail immediately with 503
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    
    Validates: Requirements 13.6
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        success_threshold: int = 2
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Name of the circuit breaker (for logging)
            failure_threshold: Number of consecutive failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery (half-open)
            success_threshold: Number of successful requests needed to close circuit
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._lock = asyncio.Lock()
        
        logger.info(
            "circuit_breaker_initialized",
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            success_threshold=success_threshold
        )
    
    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state
    
    @property
    def is_open(self) -> bool:
        """Check if circuit is open."""
        return self._state == CircuitState.OPEN
    
    @property
    def is_closed(self) -> bool:
        """Check if circuit is closed."""
        return self._state == CircuitState.CLOSED
    
    @property
    def is_half_open(self) -> bool:
        """Check if circuit is half-open."""
        return self._state == CircuitState.HALF_OPEN
    
    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """
        Execute a function through the circuit breaker.
        
        Args:
            func: Async function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            Result of the function
            
        Raises:
            CircuitBreakerError: If circuit is open
            Exception: Any exception raised by the function
        """
        async with self._lock:
            # Check if we should transition to half-open
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._transition_to_half_open()
                else:
                    # Circuit is still open, fail immediately
                    logger.warning(
                        "circuit_breaker_open",
                        name=self.name,
                        failure_count=self._failure_count,
                        time_since_failure=time.time() - (self._last_failure_time or 0)
                    )
                    raise CircuitBreakerError(
                        f"Circuit breaker '{self.name}' is open",
                        context={
                            "state": self._state,
                            "failure_count": self._failure_count,
                            "recovery_timeout": self.recovery_timeout
                        }
                    )
        
        # Execute the function
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure(e)
            raise
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt recovery."""
        if self._last_failure_time is None:
            return True
        
        time_since_failure = time.time() - self._last_failure_time
        return time_since_failure >= self.recovery_timeout
    
    def _transition_to_half_open(self) -> None:
        """Transition circuit to half-open state."""
        logger.info(
            "circuit_breaker_half_open",
            name=self.name,
            previous_state=self._state
        )
        self._state = CircuitState.HALF_OPEN
        self._success_count = 0
    
    async def _on_success(self) -> None:
        """Handle successful request."""
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                logger.info(
                    "circuit_breaker_success",
                    name=self.name,
                    success_count=self._success_count,
                    success_threshold=self.success_threshold
                )
                
                # Check if we should close the circuit
                if self._success_count >= self.success_threshold:
                    self._transition_to_closed()
            
            elif self._state == CircuitState.CLOSED:
                # Reset failure count on success
                if self._failure_count > 0:
                    logger.debug(
                        "circuit_breaker_reset_failures",
                        name=self.name,
                        previous_failure_count=self._failure_count
                    )
                    self._failure_count = 0
    
    async def _on_failure(self, exception: Exception) -> None:
        """Handle failed request."""
        async with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.time()
            
            logger.warning(
                "circuit_breaker_failure",
                name=self.name,
                state=self._state,
                failure_count=self._failure_count,
                failure_threshold=self.failure_threshold,
                error_type=type(exception).__name__,
                error_message=str(exception)
            )
            
            if self._state == CircuitState.HALF_OPEN:
                # Failure in half-open state, reopen circuit
                self._transition_to_open()
            
            elif self._state == CircuitState.CLOSED:
                # Check if we should open the circuit
                if self._failure_count >= self.failure_threshold:
                    self._transition_to_open()
    
    def _transition_to_open(self) -> None:
        """Transition circuit to open state."""
        logger.error(
            "circuit_breaker_opened",
            name=self.name,
            failure_count=self._failure_count,
            recovery_timeout=self.recovery_timeout
        )
        self._state = CircuitState.OPEN
        self._success_count = 0
    
    def _transition_to_closed(self) -> None:
        """Transition circuit to closed state."""
        logger.info(
            "circuit_breaker_closed",
            name=self.name,
            success_count=self._success_count
        )
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current circuit breaker status.
        
        Returns:
            Dictionary with status information
        """
        return {
            "name": self.name,
            "state": self._state,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "failure_threshold": self.failure_threshold,
            "success_threshold": self.success_threshold,
            "recovery_timeout": self.recovery_timeout,
            "last_failure_time": self._last_failure_time,
            "time_since_failure": (
                time.time() - self._last_failure_time 
                if self._last_failure_time else None
            )
        }
    
    async def reset(self) -> None:
        """Manually reset the circuit breaker to closed state."""
        async with self._lock:
            logger.info(
                "circuit_breaker_manual_reset",
                name=self.name,
                previous_state=self._state
            )
            self._transition_to_closed()


class CircuitBreakerRegistry:
    """Registry for managing multiple circuit breakers."""
    
    def __init__(self):
        """Initialize circuit breaker registry."""
        self._breakers: Dict[str, CircuitBreaker] = {}
        self._lock = asyncio.Lock()
    
    async def get_or_create(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        success_threshold: int = 2
    ) -> CircuitBreaker:
        """
        Get existing circuit breaker or create new one.
        
        Args:
            name: Name of the circuit breaker
            failure_threshold: Number of consecutive failures before opening
            recovery_timeout: Seconds to wait before attempting recovery
            success_threshold: Number of successful requests to close circuit
            
        Returns:
            CircuitBreaker instance
        """
        async with self._lock:
            if name not in self._breakers:
                self._breakers[name] = CircuitBreaker(
                    name=name,
                    failure_threshold=failure_threshold,
                    recovery_timeout=recovery_timeout,
                    success_threshold=success_threshold
                )
            return self._breakers[name]
    
    def get(self, name: str) -> Optional[CircuitBreaker]:
        """Get circuit breaker by name."""
        return self._breakers.get(name)
    
    def get_all_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all circuit breakers."""
        return {
            name: breaker.get_status()
            for name, breaker in self._breakers.items()
        }
    
    async def reset_all(self) -> None:
        """Reset all circuit breakers."""
        async with self._lock:
            for breaker in self._breakers.values():
                await breaker.reset()


# Global registry instance
_registry = CircuitBreakerRegistry()


async def get_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 30.0,
    success_threshold: int = 2
) -> CircuitBreaker:
    """
    Get or create a circuit breaker from the global registry.
    
    Args:
        name: Name of the circuit breaker
        failure_threshold: Number of consecutive failures before opening
        recovery_timeout: Seconds to wait before attempting recovery
        success_threshold: Number of successful requests to close circuit
        
    Returns:
        CircuitBreaker instance
    """
    return await _registry.get_or_create(
        name=name,
        failure_threshold=failure_threshold,
        recovery_timeout=recovery_timeout,
        success_threshold=success_threshold
    )


def get_all_circuit_breakers_status() -> Dict[str, Dict[str, Any]]:
    """Get status of all circuit breakers in the registry."""
    return _registry.get_all_status()
