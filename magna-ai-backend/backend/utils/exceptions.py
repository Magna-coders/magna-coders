"""
Custom exceptions for Magna AI Agent.

This module defines the exception hierarchy for different error types
across the system.
"""

from typing import Optional, Dict, Any


class MagnaAIError(Exception):
    """Base exception for all Magna AI Agent errors."""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.context = context or {}


# LLM Provider Errors
class LLMError(MagnaAIError):
    """Base exception for LLM-related errors."""
    pass


class RateLimitError(LLMError):
    """Raised when LLM provider rate limit is exceeded."""
    pass


class TimeoutError(LLMError):
    """Raised when LLM request times out."""
    pass


class AuthenticationError(LLMError):
    """Raised when LLM provider authentication fails."""
    pass


class InvalidResponseError(LLMError):
    """Raised when LLM provider returns invalid response."""
    pass


class ProviderUnavailableError(LLMError):
    """Raised when LLM provider is unavailable."""
    pass


# Tool Execution Errors
class ToolError(MagnaAIError):
    """Base exception for tool-related errors."""
    pass


class ToolNotFoundError(ToolError):
    """Raised when requested tool doesn't exist."""
    pass


class InvalidParametersError(ToolError):
    """Raised when tool parameters are invalid."""
    pass


class ToolTimeoutError(ToolError):
    """Raised when tool execution times out."""
    pass


class ExternalAPIError(ToolError):
    """Raised when external API call fails."""
    
    def __init__(self, message: str, is_transient: bool = False, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.is_transient = is_transient


# Memory System Errors
class MemoryError(MagnaAIError):
    """Base exception for memory system errors."""
    pass


class StorageQuotaExceeded(MemoryError):
    """Raised when memory storage quota is exceeded."""
    
    def __init__(self, message: str, user_id: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.user_id = user_id


class CorruptedMemoryEntry(MemoryError):
    """Raised when memory entry is corrupted."""
    
    def __init__(self, message: str, entry_id: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.entry_id = entry_id


class EmbeddingGenerationError(MemoryError):
    """Raised when embedding generation fails."""
    
    def __init__(self, message: str, user_id: str, interaction: Any, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.user_id = user_id
        self.interaction = interaction


class SyncFailure(MemoryError):
    """Raised when memory sync to backend fails."""
    
    def __init__(self, message: str, user_id: str, data: Any, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.user_id = user_id
        self.data = data


# Document Management Errors
class DocumentError(MagnaAIError):
    """Base exception for document-related errors."""
    pass


class FileTooLargeError(DocumentError):
    """Raised when uploaded file exceeds size limit."""
    
    def __init__(self, message: str, size_mb: float, limit_mb: float, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.size_mb = size_mb
        self.limit_mb = limit_mb


class UnsupportedFormatError(DocumentError):
    """Raised when document format is not supported."""
    
    def __init__(self, message: str, format: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.format = format


class UploadFailureError(DocumentError):
    """Raised when document upload fails."""
    
    def __init__(self, message: str, file_data: Any, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.file_data = file_data


class ConsentNotProvidedError(DocumentError):
    """Raised when required consent is not provided."""
    pass


class SubmissionFailureError(DocumentError):
    """Raised when document submission fails."""
    pass


# Validation Errors
class ValidationError(MagnaAIError):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, errors: list[str], context: Optional[Dict[str, Any]] = None):
        super().__init__(message, context)
        self.errors = errors


# Network Errors
class NetworkError(MagnaAIError):
    """Raised when network connectivity issues occur."""
    pass


class ConnectionError(NetworkError):
    """Raised when connection to external service fails."""
    pass
