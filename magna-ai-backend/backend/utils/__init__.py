"""
Utility Functions Module

Helper functions for logging, encryption, validation, error handling, etc.
"""

from .encryption import encrypt_data, decrypt_data
from .logging import (
    setup_logging,
    get_logger,
    setup_alert_service,
    get_alert_service,
    log_error,
    determine_severity,
    ErrorLog,
    ErrorSeverity,
    AlertService
)
from .exceptions import (
    MagnaAIError,
    LLMError, RateLimitError, TimeoutError, AuthenticationError,
    InvalidResponseError, ProviderUnavailableError,
    ToolError, ToolNotFoundError, InvalidParametersError,
    ToolTimeoutError, ExternalAPIError,
    MemoryError, StorageQuotaExceeded, CorruptedMemoryEntry,
    EmbeddingGenerationError, SyncFailure,
    DocumentError, FileTooLargeError, UnsupportedFormatError,
    UploadFailureError, ConsentNotProvidedError, SubmissionFailureError,
    ValidationError, NetworkError, ConnectionError
)
from .error_handlers import (
    handle_llm_error,
    handle_tool_error,
    handle_memory_error,
    handle_document_error,
    validate_input,
    handle_generic_error
)
from .retry import (
    retry_async,
    retry_sync,
    retry_operation,
    RetryConfig
)
from .circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    get_circuit_breaker,
    get_all_circuit_breakers_status
)
from .error_responses import (
    ErrorCode,
    create_error_response,
    authentication_error,
    authorization_error,
    rate_limit_error,
    prompt_injection_error,
    backend_communication_error,
    tool_execution_error,
    database_error,
    ai_generation_error,
    validation_error,
    internal_error
)

__all__ = [
    # Encryption
    "encrypt_data",
    "decrypt_data",
    # Logging
    "setup_logging",
    "get_logger",
    "setup_alert_service",
    "get_alert_service",
    "log_error",
    "determine_severity",
    "ErrorLog",
    "ErrorSeverity",
    "AlertService",
    # Exceptions
    "MagnaAIError",
    "LLMError",
    "RateLimitError",
    "TimeoutError",
    "AuthenticationError",
    "InvalidResponseError",
    "ProviderUnavailableError",
    "ToolError",
    "ToolNotFoundError",
    "InvalidParametersError",
    "ToolTimeoutError",
    "ExternalAPIError",
    "MemoryError",
    "StorageQuotaExceeded",
    "CorruptedMemoryEntry",
    "EmbeddingGenerationError",
    "SyncFailure",
    "DocumentError",
    "FileTooLargeError",
    "UnsupportedFormatError",
    "UploadFailureError",
    "ConsentNotProvidedError",
    "SubmissionFailureError",
    "ValidationError",
    "NetworkError",
    "ConnectionError",
    # Error Handlers
    "handle_llm_error",
    "handle_tool_error",
    "handle_memory_error",
    "handle_document_error",
    "validate_input",
    "handle_generic_error",
    # Retry Logic
    "retry_async",
    "retry_sync",
    "retry_operation",
    "RetryConfig",
    # Circuit Breaker
    "CircuitBreaker",
    "CircuitBreakerError",
    "CircuitState",
    "get_circuit_breaker",
    "get_all_circuit_breakers_status",
    # Error Responses
    "ErrorCode",
    "create_error_response",
    "authentication_error",
    "authorization_error",
    "rate_limit_error",
    "prompt_injection_error",
    "backend_communication_error",
    "tool_execution_error",
    "database_error",
    "ai_generation_error",
    "validation_error",
    "internal_error",
]

