"""
Error handling middleware for Magna AI Agent.

This module provides comprehensive error handling functions for different
error categories: LLM errors, tool errors, memory errors, document errors,
and validation errors.
"""

import asyncio
import traceback
from typing import Optional, Any, Dict, Callable
from datetime import datetime
from enum import Enum

from .exceptions import (
    LLMError, RateLimitError, TimeoutError, AuthenticationError,
    ToolError, ToolNotFoundError, InvalidParametersError, ToolTimeoutError, ExternalAPIError,
    MemoryError, StorageQuotaExceeded, CorruptedMemoryEntry, EmbeddingGenerationError, SyncFailure,
    DocumentError, FileTooLargeError, UnsupportedFormatError, UploadFailureError, ConsentNotProvidedError,
    ValidationError, NetworkError, ConnectionError
)
from .logging import get_logger


logger = get_logger(__name__)


class ErrorSeverity(str, Enum):
    """Error severity levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


# LLM Error Handling

async def handle_llm_error(
    error: LLMError,
    provider: str,
    fallback_provider_func: Optional[Callable] = None,
    retry_func: Optional[Callable] = None,
    max_retries: int = 3
) -> Optional[str]:
    """
    Handle LLM provider errors with automatic fallback and retry logic.
    
    Args:
        error: The LLM error that occurred
        provider: Name of the provider that failed
        fallback_provider_func: Function to call fallback provider
        retry_func: Function to retry the operation
        max_retries: Maximum number of retries for timeout errors
        
    Returns:
        Response from fallback provider or None if all attempts fail
        
    Validates: Requirements 15.1
    """
    logger.error(
        "llm_error_occurred",
        error_type=type(error).__name__,
        provider=provider,
        message=str(error),
        context=error.context
    )
    
    if isinstance(error, RateLimitError):
        logger.warning(
            "rate_limit_exceeded",
            provider=provider,
            message="Switching to fallback provider"
        )
        # Try fallback provider immediately
        if fallback_provider_func:
            try:
                return await fallback_provider_func()
            except Exception as e:
                logger.error("fallback_provider_failed", error=str(e))
                return None
    
    elif isinstance(error, TimeoutError):
        logger.warning(
            "llm_timeout",
            provider=provider,
            max_retries=max_retries
        )
        # Retry with exponential backoff
        if retry_func:
            for attempt in range(max_retries):
                await asyncio.sleep(2 ** attempt)
                try:
                    logger.info("retrying_llm_request", attempt=attempt + 1)
                    return await retry_func()
                except TimeoutError:
                    if attempt < max_retries - 1:
                        continue
                    else:
                        logger.warning("all_retries_failed", attempts=max_retries)
        
        # All retries failed, try fallback
        if fallback_provider_func:
            try:
                return await fallback_provider_func()
            except Exception as e:
                logger.error("fallback_provider_failed", error=str(e))
                return None
    
    elif isinstance(error, AuthenticationError):
        # Log critical error, cannot recover
        logger.critical(
            "authentication_failed",
            provider=provider,
            message="Invalid API key or authentication failure"
        )
        # Try fallback provider
        if fallback_provider_func:
            try:
                return await fallback_provider_func()
            except Exception as e:
                logger.error("fallback_provider_failed", error=str(e))
                return None
    
    else:
        # Unknown error, try fallback
        logger.error(
            "unknown_llm_error",
            provider=provider,
            error_type=type(error).__name__,
            message=str(error)
        )
        if fallback_provider_func:
            try:
                return await fallback_provider_func()
            except Exception as e:
                logger.error("fallback_provider_failed", error=str(e))
                return None
    
    return None


# Tool Error Handling

async def handle_tool_error(
    error: ToolError,
    tool_name: str,
    parameters: Dict[str, Any],
    retry_func: Optional[Callable] = None,
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Handle tool execution errors with retry logic.
    
    Args:
        error: The tool error that occurred
        tool_name: Name of the tool that failed
        parameters: Parameters passed to the tool
        retry_func: Function to retry the tool execution
        max_retries: Maximum number of retries
        
    Returns:
        Dictionary with success status, error message, and suggestion
        
    Validates: Requirements 15.2, 15.3
    """
    logger.error(
        "tool_error_occurred",
        tool_name=tool_name,
        error_type=type(error).__name__,
        message=str(error),
        parameters=parameters
    )
    
    if isinstance(error, ToolNotFoundError):
        # Cannot retry, tool doesn't exist
        logger.error("tool_not_found", tool_name=tool_name)
        return {
            "success": False,
            "error": f"Tool '{tool_name}' is not available",
            "suggestion": "Try a different approach or check tool name"
        }
    
    elif isinstance(error, InvalidParametersError):
        # Cannot retry, parameters are wrong
        logger.error(
            "invalid_tool_parameters",
            tool_name=tool_name,
            parameters=parameters,
            message=str(error)
        )
        return {
            "success": False,
            "error": f"Invalid parameters for '{tool_name}': {error.message}",
            "suggestion": "Check parameter format and required fields"
        }
    
    elif isinstance(error, ToolTimeoutError):
        # Retry with exponential backoff
        logger.warning("tool_timeout", tool_name=tool_name, max_retries=max_retries)
        
        if retry_func:
            for attempt in range(max_retries):
                if attempt > 0:
                    await asyncio.sleep(2 ** attempt)
                    logger.info("retrying_tool_execution", tool_name=tool_name, attempt=attempt + 1)
                
                try:
                    result = await retry_func()
                    logger.info("tool_retry_succeeded", tool_name=tool_name, attempt=attempt + 1)
                    return result
                except ToolTimeoutError:
                    if attempt < max_retries - 1:
                        continue
                    else:
                        logger.warning("all_tool_retries_failed", tool_name=tool_name, attempts=max_retries)
        
        return {
            "success": False,
            "error": f"Tool '{tool_name}' execution timed out after {max_retries} attempts",
            "suggestion": "Try again later or use an alternative method"
        }
    
    elif isinstance(error, ExternalAPIError):
        # Retry for transient errors
        logger.warning(
            "external_api_error",
            tool_name=tool_name,
            is_transient=error.is_transient,
            message=str(error)
        )
        
        if error.is_transient and retry_func:
            for attempt in range(max_retries):
                if attempt > 0:
                    await asyncio.sleep(2 ** attempt)
                    logger.info("retrying_api_call", tool_name=tool_name, attempt=attempt + 1)
                
                try:
                    result = await retry_func()
                    logger.info("api_retry_succeeded", tool_name=tool_name, attempt=attempt + 1)
                    return result
                except ExternalAPIError:
                    if attempt < max_retries - 1:
                        continue
                    else:
                        logger.warning("all_api_retries_failed", tool_name=tool_name, attempts=max_retries)
        
        return {
            "success": False,
            "error": f"External service error for '{tool_name}': {error.message}",
            "suggestion": "Service may be temporarily unavailable, try again later"
        }
    
    else:
        # Unknown tool error
        logger.error(
            "unknown_tool_error",
            tool_name=tool_name,
            error_type=type(error).__name__,
            message=str(error)
        )
        return {
            "success": False,
            "error": f"Tool '{tool_name}' failed: {error.message}",
            "suggestion": "Check tool configuration and try again"
        }


# Memory Error Handling

async def handle_memory_error(
    error: MemoryError,
    memory_system: Any
) -> None:
    """
    Handle memory system errors with appropriate recovery actions.
    
    Args:
        error: The memory error that occurred
        memory_system: Reference to the memory system for recovery actions
        
    Validates: Requirements 15.4
    """
    logger.error(
        "memory_error_occurred",
        error_type=type(error).__name__,
        message=str(error),
        context=error.context
    )
    
    if isinstance(error, StorageQuotaExceeded):
        # Trigger aggressive pruning
        logger.warning(
            "storage_quota_exceeded",
            user_id=error.user_id,
            message="Triggering memory pruning"
        )
        try:
            pruned_count = await memory_system.prune_memory(
                user_id=error.user_id,
                target_size_mb=4.0  # Prune to 80% of limit
            )
            logger.info(
                "memory_pruned",
                user_id=error.user_id,
                pruned_count=pruned_count
            )
        except Exception as e:
            logger.error("memory_pruning_failed", user_id=error.user_id, error=str(e))
    
    elif isinstance(error, CorruptedMemoryEntry):
        # Remove corrupted entry
        logger.warning(
            "corrupted_memory_entry",
            entry_id=error.entry_id,
            message="Removing corrupted entry"
        )
        try:
            await memory_system.remove_entry(error.entry_id)
            logger.info("corrupted_entry_removed", entry_id=error.entry_id)
        except Exception as e:
            logger.error("entry_removal_failed", entry_id=error.entry_id, error=str(e))
    
    elif isinstance(error, EmbeddingGenerationError):
        # Store without embedding (episodic only)
        logger.warning(
            "embedding_generation_failed",
            user_id=error.user_id,
            message="Storing interaction without embedding"
        )
        try:
            await memory_system.store_without_embedding(
                user_id=error.user_id,
                interaction=error.interaction
            )
            logger.info("stored_without_embedding", user_id=error.user_id)
        except Exception as e:
            logger.error("storage_without_embedding_failed", user_id=error.user_id, error=str(e))
    
    elif isinstance(error, SyncFailure):
        # Queue for retry
        logger.warning(
            "memory_sync_failed",
            user_id=error.user_id,
            message="Queueing for later sync"
        )
        try:
            await memory_system.queue_for_sync(
                user_id=error.user_id,
                data=error.data
            )
            logger.info("queued_for_sync", user_id=error.user_id)
        except Exception as e:
            logger.error("sync_queueing_failed", user_id=error.user_id, error=str(e))


# Document Error Handling

async def handle_document_error(
    error: DocumentError,
    retry_func: Optional[Callable] = None,
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Handle document management errors.
    
    Args:
        error: The document error that occurred
        retry_func: Function to retry the operation
        max_retries: Maximum number of retries for upload failures
        
    Returns:
        Dictionary with success status, error message, and suggestion
        
    Validates: Requirements 15.4
    """
    logger.error(
        "document_error_occurred",
        error_type=type(error).__name__,
        message=str(error),
        context=error.context
    )
    
    if isinstance(error, FileTooLargeError):
        logger.warning(
            "file_too_large",
            size_mb=error.size_mb,
            limit_mb=error.limit_mb
        )
        return {
            "success": False,
            "error": f"File size {error.size_mb:.2f}MB exceeds limit of {error.limit_mb}MB",
            "suggestion": "Please compress the file or upload a smaller version"
        }
    
    elif isinstance(error, UnsupportedFormatError):
        logger.warning("unsupported_format", format=error.format)
        return {
            "success": False,
            "error": f"Format '{error.format}' is not supported",
            "suggestion": "Please convert to PDF, DOCX, or TXT format"
        }
    
    elif isinstance(error, UploadFailureError):
        # Retry upload
        logger.warning("upload_failed", message="Retrying upload")
        
        if retry_func:
            for attempt in range(max_retries):
                if attempt > 0:
                    await asyncio.sleep(2 ** attempt)
                    logger.info("retrying_upload", attempt=attempt + 1)
                
                try:
                    result = await retry_func()
                    logger.info("upload_retry_succeeded", attempt=attempt + 1)
                    return result
                except UploadFailureError:
                    if attempt < max_retries - 1:
                        continue
                    else:
                        logger.warning("all_upload_retries_failed", attempts=max_retries)
        
        return {
            "success": False,
            "error": "Upload failed after multiple attempts",
            "suggestion": "Please check your connection and try again"
        }
    
    elif isinstance(error, ConsentNotProvidedError):
        logger.warning("consent_not_provided", message=str(error))
        return {
            "success": False,
            "error": "Cannot submit document without your consent",
            "suggestion": "Please approve the consent request to proceed"
        }
    
    else:
        logger.error(
            "unknown_document_error",
            error_type=type(error).__name__,
            message=str(error)
        )
        return {
            "success": False,
            "error": f"Document operation failed: {error.message}",
            "suggestion": "Please try again or contact support"
        }


# Input Validation

def validate_input(data: Dict[str, Any], required_fields: list[str]) -> Dict[str, Any]:
    """
    Validate input data for required fields and basic format.
    
    Args:
        data: Input data to validate
        required_fields: List of required field names
        
    Returns:
        Dictionary with validation result
        
    Validates: Requirements 15.6
    """
    errors = []
    
    # Check required fields
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f"Field '{field}' is required")
    
    # Check for empty strings
    for field, value in data.items():
        if isinstance(value, str) and len(value.strip()) == 0:
            errors.append(f"Field '{field}' cannot be empty")
    
    if errors:
        logger.warning("input_validation_failed", errors=errors, data=data)
        return {
            "valid": False,
            "errors": errors,
            "message": "Input validation failed: " + "; ".join(errors)
        }
    
    logger.debug("input_validation_passed", data=data)
    return {
        "valid": True,
        "errors": [],
        "message": "Validation passed"
    }


# Generic Error Handler

async def handle_generic_error(
    error: Exception,
    context: Dict[str, Any],
    severity: ErrorSeverity = ErrorSeverity.ERROR
) -> Dict[str, Any]:
    """
    Handle generic errors with logging and context.
    
    Args:
        error: The exception that occurred
        context: Context information about the error
        severity: Error severity level
        
    Returns:
        Dictionary with error information
        
    Validates: Requirements 15.4, 15.7
    """
    error_info = {
        "error_type": type(error).__name__,
        "message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
        "context": context,
        "stack_trace": traceback.format_exc()
    }
    
    # Log based on severity
    if severity == ErrorSeverity.CRITICAL:
        logger.critical("critical_error", **error_info)
    elif severity == ErrorSeverity.ERROR:
        logger.error("error_occurred", **error_info)
    elif severity == ErrorSeverity.WARNING:
        logger.warning("warning", **error_info)
    else:
        logger.info("info", **error_info)
    
    return {
        "success": False,
        "error": str(error),
        "error_type": type(error).__name__,
        "suggestion": "An unexpected error occurred. Please try again or contact support.",
        "timestamp": error_info["timestamp"]
    }
