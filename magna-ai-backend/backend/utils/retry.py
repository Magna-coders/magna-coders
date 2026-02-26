"""
Retry logic with exponential backoff for backend communication.

This module provides decorators and utilities for retrying failed operations
with exponential backoff delays.
"""

import asyncio
import functools
from typing import Callable, TypeVar, Any, Optional, Tuple, Type
from datetime import datetime

from .logging import get_logger
from .exceptions import NetworkError, ConnectionError, TimeoutError

logger = get_logger(__name__)

T = TypeVar('T')


class RetryConfig:
    """Configuration for retry behavior."""
    
    def __init__(
        self,
        max_attempts: int = 3,
        delays: Tuple[float, ...] = (1.0, 2.0, 4.0),
        retryable_exceptions: Tuple[Type[Exception], ...] = (
            NetworkError,
            ConnectionError,
            TimeoutError,
            Exception
        )
    ):
        """
        Initialize retry configuration.
        
        Args:
            max_attempts: Maximum number of retry attempts (default: 3)
            delays: Tuple of delay times in seconds for each retry (default: 1s, 2s, 4s)
            retryable_exceptions: Tuple of exception types that should trigger retry
        """
        self.max_attempts = max_attempts
        self.delays = delays
        self.retryable_exceptions = retryable_exceptions
    
    def get_delay(self, attempt: int) -> float:
        """
        Get delay for a specific attempt.
        
        Args:
            attempt: Attempt number (0-indexed)
            
        Returns:
            Delay in seconds
        """
        if attempt < len(self.delays):
            return self.delays[attempt]
        # If we exceed configured delays, use the last delay
        return self.delays[-1] if self.delays else 0.0


def retry_async(
    config: Optional[RetryConfig] = None,
    operation_name: Optional[str] = None
) -> Callable:
    """
    Decorator for async functions to add retry logic with exponential backoff.
    
    Args:
        config: RetryConfig instance (uses default if None)
        operation_name: Name of the operation for logging (uses function name if None)
        
    Returns:
        Decorated function with retry logic
        
    Example:
        @retry_async(config=RetryConfig(max_attempts=3, delays=(1, 2, 4)))
        async def fetch_user_data(user_id: str):
            # Your async code here
            pass
    
    Validates: Requirements 13.6
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            op_name = operation_name or func.__name__
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    # Log attempt
                    if attempt > 0:
                        logger.info(
                            "retry_attempt",
                            operation=op_name,
                            attempt=attempt + 1,
                            max_attempts=config.max_attempts
                        )
                    
                    # Execute the function
                    result = await func(*args, **kwargs)
                    
                    # Log success if this was a retry
                    if attempt > 0:
                        logger.info(
                            "retry_succeeded",
                            operation=op_name,
                            attempt=attempt + 1
                        )
                    
                    return result
                    
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    # Log the failure
                    logger.warning(
                        "operation_failed",
                        operation=op_name,
                        attempt=attempt + 1,
                        max_attempts=config.max_attempts,
                        error_type=type(e).__name__,
                        error_message=str(e)
                    )
                    
                    # If this was the last attempt, don't delay
                    if attempt < config.max_attempts - 1:
                        delay = config.get_delay(attempt)
                        logger.info(
                            "retry_delay",
                            operation=op_name,
                            delay_seconds=delay,
                            next_attempt=attempt + 2
                        )
                        await asyncio.sleep(delay)
                    else:
                        # All retries exhausted
                        logger.error(
                            "all_retries_exhausted",
                            operation=op_name,
                            total_attempts=config.max_attempts,
                            final_error=str(e)
                        )
            
            # If we get here, all retries failed
            raise last_exception
        
        return wrapper
    return decorator


def retry_sync(
    config: Optional[RetryConfig] = None,
    operation_name: Optional[str] = None
) -> Callable:
    """
    Decorator for sync functions to add retry logic with exponential backoff.
    
    Args:
        config: RetryConfig instance (uses default if None)
        operation_name: Name of the operation for logging (uses function name if None)
        
    Returns:
        Decorated function with retry logic
        
    Example:
        @retry_sync(config=RetryConfig(max_attempts=3, delays=(1, 2, 4)))
        def fetch_user_data(user_id: str):
            # Your sync code here
            pass
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            import time
            
            op_name = operation_name or func.__name__
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    # Log attempt
                    if attempt > 0:
                        logger.info(
                            "retry_attempt",
                            operation=op_name,
                            attempt=attempt + 1,
                            max_attempts=config.max_attempts
                        )
                    
                    # Execute the function
                    result = func(*args, **kwargs)
                    
                    # Log success if this was a retry
                    if attempt > 0:
                        logger.info(
                            "retry_succeeded",
                            operation=op_name,
                            attempt=attempt + 1
                        )
                    
                    return result
                    
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    # Log the failure
                    logger.warning(
                        "operation_failed",
                        operation=op_name,
                        attempt=attempt + 1,
                        max_attempts=config.max_attempts,
                        error_type=type(e).__name__,
                        error_message=str(e)
                    )
                    
                    # If this was the last attempt, don't delay
                    if attempt < config.max_attempts - 1:
                        delay = config.get_delay(attempt)
                        logger.info(
                            "retry_delay",
                            operation=op_name,
                            delay_seconds=delay,
                            next_attempt=attempt + 2
                        )
                        time.sleep(delay)
                    else:
                        # All retries exhausted
                        logger.error(
                            "all_retries_exhausted",
                            operation=op_name,
                            total_attempts=config.max_attempts,
                            final_error=str(e)
                        )
            
            # If we get here, all retries failed
            raise last_exception
        
        return wrapper
    return decorator


async def retry_operation(
    operation: Callable[..., Any],
    *args: Any,
    config: Optional[RetryConfig] = None,
    operation_name: Optional[str] = None,
    **kwargs: Any
) -> Any:
    """
    Retry an async operation with exponential backoff.
    
    This is a functional alternative to the decorator for cases where
    you can't use decorators.
    
    Args:
        operation: Async function to retry
        *args: Positional arguments for the operation
        config: RetryConfig instance (uses default if None)
        operation_name: Name of the operation for logging
        **kwargs: Keyword arguments for the operation
        
    Returns:
        Result of the operation
        
    Raises:
        Last exception if all retries fail
        
    Example:
        result = await retry_operation(
            fetch_data,
            user_id="123",
            config=RetryConfig(max_attempts=3),
            operation_name="fetch_user_data"
        )
    """
    if config is None:
        config = RetryConfig()
    
    op_name = operation_name or operation.__name__
    last_exception = None
    
    for attempt in range(config.max_attempts):
        try:
            # Log attempt
            if attempt > 0:
                logger.info(
                    "retry_attempt",
                    operation=op_name,
                    attempt=attempt + 1,
                    max_attempts=config.max_attempts
                )
            
            # Execute the operation
            result = await operation(*args, **kwargs)
            
            # Log success if this was a retry
            if attempt > 0:
                logger.info(
                    "retry_succeeded",
                    operation=op_name,
                    attempt=attempt + 1
                )
            
            return result
            
        except config.retryable_exceptions as e:
            last_exception = e
            
            # Log the failure
            logger.warning(
                "operation_failed",
                operation=op_name,
                attempt=attempt + 1,
                max_attempts=config.max_attempts,
                error_type=type(e).__name__,
                error_message=str(e)
            )
            
            # If this was the last attempt, don't delay
            if attempt < config.max_attempts - 1:
                delay = config.get_delay(attempt)
                logger.info(
                    "retry_delay",
                    operation=op_name,
                    delay_seconds=delay,
                    next_attempt=attempt + 2
                )
                await asyncio.sleep(delay)
            else:
                # All retries exhausted
                logger.error(
                    "all_retries_exhausted",
                    operation=op_name,
                    total_attempts=config.max_attempts,
                    final_error=str(e)
                )
    
    # If we get here, all retries failed
    raise last_exception
